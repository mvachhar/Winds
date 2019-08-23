import { Service, ServiceProps, nginx, mergeEnvSimple } from "@adpt/cloud";
import { ServiceDeployment } from "@adpt/cloud/k8s";
import { MongoDB, TestMongoDB } from "./MongoDB";
import Adapt, { concatStyles, Style, ruleNoRematch } from "@adpt/core";
import { GetStreamIO, GetStreamIOProvider, Algolia, AlgoliaProvider } from "./lib";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { ReactApp, ReactAppProps } from "@adpt/cloud/nodejs";
import { Redis, TestRedis } from "./Redis";
import { HttpServerProps, HttpServer } from "@adpt/cloud/http";

export function kubeClusterInfo() {
    // tslint:disable-next-line:no-var-requires
    return { kubeconfig: require(process.env["KUBECONFIG"] || "./kubeconfig") }
}

// Terminate containers quickly for demos
const demoProps = {
    podProps: { terminationGracePeriodSeconds: 0 }
};

/*
 * Style rules common to all dev style sheets
 */
function commonDevStyle() {
    const devConfig = dotenv.parse(readFileSync("dev-config"));

    return <Style>
        {ReactApp} {Adapt.rule<ReactAppProps>(({ handle, ...props }, info) => {
            const buildArgs = mergeEnvSimple(props.buildOptions.buildArgs, devConfig);
            const buildOptions = { ...props.buildOptions, buildArgs };
            console.log(buildOptions)
            return ruleNoRematch(info, <ReactApp {...props} buildOptions={buildOptions} />);
        })}

        { GetStreamIO } {
                Adapt.rule(() => <GetStreamIOProvider
                    baseUrl={devConfig["STREAM_API_BASE_URL"]}
                    appId={devConfig["STREAM_APP_ID"]}
                    apiKey={devConfig["STREAM_API_KEY"]}
                    apiSecret={devConfig["STREAM_API_SECRET"]}
                />)
            }

        { Algolia } {
                Adapt.rule(() => <AlgoliaProvider
                    appId={devConfig["REACT_APP_ALGOIA_APP_ID"]}
                    searchKey={devConfig["REACT_APP_ALGOLIA_SEARCH_KEY"]}
                    adminKey={devConfig["ALGOLIA_WRITE_KEY"]}
                />)
            }
    </Style>;
    }
    
    /*
     * Kubernetes testing/dev style
     */
    export const k8sDevStyle = concatStyles(commonDevStyle(),
    <Style>
            {MongoDB} {Adapt.rule(() => <TestMongoDB />)}
            {Redis} {Adapt.rule(() => <TestRedis />)}
            {HttpServer} {Adapt.rule<HttpServerProps>(({ handle, ...props }) => <nginx.HttpServer {...props} scope="external" />)}

            {Service} {Adapt.rule<ServiceProps>(({ handle, ...props }) =>
                <ServiceDeployment config={kubeClusterInfo()} {...props} {...demoProps} />)}
        </Style>);
