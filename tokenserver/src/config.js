

export const config = {

    port: process.env.TS_PORT || "10000",

    endpointsPrefix: process.env.TS_ENDPOINT_PREFIX || "/mdenet-auth",

    clientId: process.env.TS_CLIENT_ID,

    clientSecret: process.env.TS_CLIENT_SECRET,

    encKey: process.env.TS_ENC_KEY,

    trustedWebOrigins: process.env.TRUSTED_ORIGINS?.split(",") || 'http://127.0.0.1:8080',

    cookieOptions: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    },

    githubApiVersion : '2022-11-28'

}