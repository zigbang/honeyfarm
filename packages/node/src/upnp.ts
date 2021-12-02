import client from "nat-upnp-2";
import Logger from "./logger";

class PortMapper {

	private client_ = null;

	constructor() {
		this.client_ = client.createClient({
			timeout: 10 * 1000
		});
	}

	public async addPortMapping(port: number, ttl: number) {

		this.client_.portMapping({
			public: port,
			private: port,
			ttl: ttl
		}, (err) => {
			if(err === null) {
				Logger.info(`Added port mapping successfully...${port}`);
			}
			else {
				Logger.error(`Failed port mapping...${port}, ${err}`);
			}
		} );
	}

	public removePortMapping(port: number) {

		this.client_.portUnmapping({
			public: port
		});
		Logger.info(`Removed port mapping successfully...${port}`);
	}

	public async getMappedPort() {
		this.client_.getMappings( (err, results) => {
			console.log("MappingList: ", results);
		});
	}

	public async getExternalIp() {
		this.client_.externalIp((err, ip) => {
			console.log("External IP: ", ip);
		})
	}
}


export default new PortMapper();