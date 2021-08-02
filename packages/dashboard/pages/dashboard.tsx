import React from "react"
import Head from "next/head"
import { GetServerSideProps } from 'next'

import api from "../src/api"
import { argsParser } from "../src/utils"

export const getServerSideProps: GetServerSideProps = async (context) => {
    const endpoint = argsParser(process.argv, "--endpoint")
    return {props: { endpoint: endpoint }}
}
export default class Dashboard extends React.Component<{endpoint?: string}> {
    state =  {
        dashboad: []
    }
    private api

    constructor(props: {}) {
        super(props)
	}

    render() {
        return (
            <div style={{height: "100%", width: "100%"}}>
                <Head>
                    <title>dashboard</title>
                </Head>
                <div style = {page}>
                    {this.state.dashboad}
                </div>
            </div>
        )
    }

    async componentDidMount() {
        this.api  = new api(this.props.endpoint)
        await this.makeChild()
    }

    private async makeChild() {
        try {
            const result = await this.api.getDevices()
            if (!result) return null
            
            const data = result.data as { [key: string]: { showInDashboard?: boolean, status: string, platform: string, name: string, udid: string } }

            if (data) {
                const views: JSX.Element[] = []

                Object.entries(data).filter(([key, value]) => {
                const nodeAddress = key.split(":")[0]
                const status = value.showInDashboard ? "DASHBOARD" : value.status

				const url = `http://${nodeAddress}:8000/#!action=stream&udid=${value.udid}&player=mse&ws=ws%3A%2F%2F${nodeAddress}%3A8000%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3D${value.udid}`
				console.log("url : ", url)
                if(value.platform === "android" && nodeAddress) {
                    const view = (
                        <div style={page_view} key={`${value.udid}`}>
                            <div style={{ width: "fit-content", height: "fit-content"}}>
                                <div>{value.name} [{status}]</div>
                            </div>
							<iframe height="750px" width="500px" src={url} frameBorder="0"></iframe>
                        </div>
                    )
                    views.push(view)
                }
                })

                this.setState({dashboad: views})
            }
        
        } catch(e) {
            console.error(e)
        }
    }
}

const page = {
    backgroundColor: "rgb(248, 248, 248)",
    height: "auto",
    width: "auto",
    display: "inline"
}

const page_view= {
    height: "fit-content",
    width: "500px",
    display: "inline-block",
    paddingTop: "40px",
    alignItems: "center"
}
