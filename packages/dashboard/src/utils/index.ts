
export function argsParser(args: string[], targetArg: string) {
    for(const arg of args) {
        if (arg.startsWith(targetArg) && arg.split("=").length > 1) {
            return arg.split("=")[1]
        }
    }

    return ""
}