module.exports = {
    apps : [{
        name:       "honey-farm-node",
        script:     "./dist/src/app.js",
        watch:      false,
        exec_mode:  "fork",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
            JAVA_HOME: "/usr/lib/jvm/java-8-openjdk-arm64//bin/java",
            ANDROID_HOME: "/usr/lib/android-sdk",
            USE_CRHOMIUM: true,
            SERVER: "http://honey.zigbang.io"
        },
        env_production_mac: {
            NODE_ENV: "production",
            START_PORT: 4724,
            MAX_DEVICE_COUNT: 16,
            SERVER: "http://honey.zigbang.io"
        }
    }]
}
// pm2 걷어내기