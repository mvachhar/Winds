import {
    useImperativeMethods,
    PrimitiveComponent
} from "@adpt/core";

export abstract class GetStreamIO extends PrimitiveComponent { };

export function GetStreamIOProvider(props: {
    appId: string,
    apiKey: string,
    apiSecret?: string,
    baseUrl: string
}) {
    useImperativeMethods(() => ({
        connectEnv: () => ({
            STREAM_API_BASE_URL: `https:///windspersonalization.getstream.io/personalization/v1.0`,
            STREAM_APP_ID: props.appId,
            STREAM_API_KEY: props.apiKey,
            STREAM_API_SECRET: props.apiSecret,
        })
    }));
    return null;
}

export abstract class Algolia extends PrimitiveComponent { };

export function AlgoliaProvider(props: {
    appId: string;
    searchKey: string;
    adminKey?: string;
}) {
    useImperativeMethods(() => ({
        connectEnv: () => ({
            ALGOLIA_APPID: props.appId,
            ALGOLIA_SEARCH_KEY: props.searchKey,
            ALGOLIA_ADMIN_KEY: props.adminKey,
        })
    }));
    return null;
}
