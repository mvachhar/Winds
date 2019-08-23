import Adapt, {
    callInstanceMethod,
    handle,
    useImperativeMethods,
    PrimitiveComponent,
    SFCDeclProps,
    SFCBuildProps
} from "@adpt/core";
import { Service, Container, NetworkService, ConnectToInstance, Environment } from "@adpt/cloud";

export abstract class MongoDB extends PrimitiveComponent { };

const testMongoDefaultProps = {
    port: 27017
}

export interface TestMongoProps {
    port: number;
}

export function TestMongoDB(props: SFCDeclProps<TestMongoProps>) {
    const lprops = props as SFCBuildProps<TestMongoProps, typeof testMongoDefaultProps>;
    const svc = handle();
    const mongo = handle();

    useImperativeMethods<ConnectToInstance>(() => ({
        connectEnv: (): Environment => {
            const hostname = callInstanceMethod(svc, undefined, "hostname");
            const port = callInstanceMethod(svc, undefined, "port");
            if (!hostname || !port) return {};
            return {
                MONGODB_URI: `mongodb://${hostname}:${port}`
            };
        }
    }));
    return <Service>
        <NetworkService
            handle={svc}
            endpoint={mongo}
            port={lprops.port}
            targetPort={27017}
        />
        <Container
            handle={mongo} 
            name="mongodb"
            image="mongo:latest"
            ports={[27017]}
            imagePullPolicy="Always"
        />
    </Service>
}
TestMongoDB.defaultProps = testMongoDefaultProps;