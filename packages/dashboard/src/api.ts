import axios from "axios"
export default class api {
    private host = "http://localhost:4723"

    constructor(host?: string) {
        this.host = host ? host : this.host
    }

    async getDevices() {
        try {
            const result = await axios.get(`${this.host}/devices`, 
            {
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                },
                params: { all: true}
            })
    
            return result
        } catch (e) {
            console.error(e)
            return undefined
        }
    }

}