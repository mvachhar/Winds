import Adapt, {
    callInstanceMethod,
    handle,
    useImperativeMethods,
    PrimitiveComponent,
    SFCDeclProps,
    SFCBuildProps
} from "@adpt/core";
import { Service, Container, NetworkService, ConnectToInstance, Environment } from "@adpt/cloud";

export abstract class Redis extends PrimitiveComponent { };

const testRedisDefaultProps = {
    port: 6379
}

export interface TestRedisProps {
    port: number;
}

export function TestRedis(props: SFCDeclProps<TestRedisProps>) {
    const lprops = props as SFCBuildProps<TestRedisProps, typeof testRedisDefaultProps>;
    const svc = handle();
    const redis = handle();

    useImperativeMethods<ConnectToInstance>(() => ({
        connectEnv: (): Environment => {
            const hostname = callInstanceMethod(svc, undefined, "hostname");
            const port = callInstanceMethod(svc, undefined, "port");
            if (!hostname || !port) return {};
            return {
                REDIS_URI: `redis://${hostname}:${port}`
            };
        }
    }));
    return <Service>
        <NetworkService
            handle={svc}
            endpoint={redis}
            port={lprops.port}
            targetPort={6379}
        />
        <Container
            handle={redis} 
            name="redis"
            image="redis:buster"
            ports={[27017]}
            imagePullPolicy="Always"
        />
    </Service>
}
TestRedis.defaultProps = testRedisDefaultProps;