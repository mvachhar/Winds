import Adapt, {
    Group,
    handle,
    Handle,
    SFCDeclProps,
    SFCBuildProps,
    Sequence,
    useImperativeMethods,
    callInstanceMethod,
    useMethodFrom
} from "@adpt/core";
import { k8sDevStyle } from "./styles";
import {
    mergeEnvPairs,
    Environment,
    useConnectTo,
    updateEnvVars,
    NetworkScope,
    NetworkService,
    NetworkServiceScope,
    Service,
    Container,
    ConnectToInstance,
    renameEnvVars
} from "@adpt/cloud";
import { Algolia, GetStreamIO } from "./lib";
import { MongoDB } from "./MongoDB";
import { LocalDockerImage } from "@adpt/cloud/dist/src/docker";
import { readFileSync } from "fs";
import { ReactApp } from "@adpt/cloud/dist/src/nodejs";
import { Redis } from "./Redis";

interface WindsApiProps {
    port: number;
    mongo: Handle;
    streamIO: Handle;
    algolia: Handle;
    redis: Handle;
    scope: NetworkServiceScope;
}

const windsApiDefaultProps = {
    port: 8080,
    scope: "external"
}

function WindsApi(props: SFCDeclProps<WindsApiProps>) {
    const { algolia, mongo, streamIO, redis, port, scope } =
        props as SFCBuildProps<WindsApiProps, typeof windsApiDefaultProps>;

    const connections = useConnectTo([mongo, algolia, streamIO, redis],
        (e: Environment) => updateEnvVars(e, (name, value) => {
            switch (name) {
                case "MONGODB_URI": return { name: "DATABASE_URI", value: value + "/WINDS" }
                case "ALGOLIA_ADMIN_KEY": return { name: "ALGOLIA_WRITE_KEY", value }
                case "REDIS_URI": return { name: "CACHE_URI", value }
                default: return { name, value }
            }
        }));

    const jwtSecret = "FIXME";

    const env = mergeEnvPairs(connections, {
        DOCKER: "true",
        PRODUCT_URL: "",
        PRODUCT_NAME: "WindsApi",
        PRODUCT_AUTHOR: "Stream",
        JWT_SECRET: jwtSecret,
        API_PORT: port.toString(),
    });

    const img = handle();
    const netSvc = handle();
    const nodeCtr = handle();

    useMethodFrom(netSvc, "hostname");
    useMethodFrom(netSvc, "port");
    useImperativeMethods<ConnectToInstance>(() => ({
        connectEnv: (): Environment => {
            const hostname = callInstanceMethod<string | undefined>(netSvc, undefined, "hostname", NetworkScope.external);
            const port = callInstanceMethod<string | undefined>(netSvc, undefined, "port");
            if (!(hostname && port)) {
                console.log("No WINDS hostname or port");
                return {};
            }
            const uri = `http://${hostname}:${port}`;
            console.log("WINDS URI:", uri);
            return {
                WINDS_API_URI: uri
            };
        }
    }));

    return <Sequence>
        <LocalDockerImage key={props.key + "-img"} handle={img}
            dockerfile={readFileSync("../api/Dockerfile").toString()}
            contextDir={"../api"}
            options={{ imageName: "winds-api", uniqueTag: true }} />
        {mongo}
        {algolia}
        {streamIO}
        <Service>
            <NetworkService
                key={props.key + "-netsvc"}
                handle={netSvc}
                endpoint={nodeCtr}
                port={port}
                targetPort={8080}
                scope={scope}
            />
            <Container
                key={props.key}
                name="node-service"
                handle={nodeCtr}
                environment={env}
                image={img}
                ports={[8080]}
                imagePullPolicy="IfNotPresent"
            />
        </Service>
    </Sequence >
}
WindsApi.defaultProps = windsApiDefaultProps;

function App() {
    const mongo = handle();
    const streamIO = handle();
    const algolia = handle();
    const api = handle();
    const redis = handle();

    const reactEnv = useConnectTo([api], (e: Environment) => renameEnvVars(e, { WINDS_API_URI: "REACT_APP_API_ENDPOINT" }));
    console.log("ReactEnv:", reactEnv);

    return <Group key="App">
        <GetStreamIO handle={streamIO} />
        <Algolia handle={algolia} />
        <MongoDB handle={mongo} />
        <Redis handle={redis} />
        <ReactApp srcDir="../app" buildOptions={{ buildArgs: reactEnv }} />
        <WindsApi handle={api} port={8080} mongo={mongo} streamIO={streamIO} algolia={algolia} redis={redis}/>
    </Group>;
}

Adapt.stack("default", <App />, k8sDevStyle);
Adapt.stack("k8sDev", <App />, k8sDevStyle);
