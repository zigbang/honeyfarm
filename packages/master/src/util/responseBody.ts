export class ResponseBody {
    private result_code: "ok" | "fail";
    private description: string;
    private data: Array<any>;

    public constructor(builder: ResponseBodyBuilder) {
        this.result_code = builder.get_result_code();
        this.description = builder.get_description();
        this.data = builder.get_data()
        return this;
    }
}

export class ResponseBodyBuilder {
    private _result_code: "ok" | "fail" = "fail";
    private _description: string = "";
    private _data: Array<any> = [];

    public build() {
        return new ResponseBody(this);
    }

    public get_result_code() {
        return this._result_code;
    }

    public set_result_code(value: "ok" | "fail") {
        this._result_code = value;
        return this;
    }

    public get_description() {
        return this._description;
    }

    public set_description(value: string) {
        this._description = value;
        return this;
    }

    public get_data() {
        return this._data;
    }

    public set_data(value: Array<any>) {
        this._data = value;
        return this;
    }

}