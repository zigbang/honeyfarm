
# HoneyFarm README.

### HoneyFarm 이란?
HoneyFarm 기존에 존재하던 단일 기기 UI Testing을 넘어, 복수의 기기들을 동시다발적으로 테스팅 할 수 있는 테스팅 플랫폼입니다. 
iOS, Android를 포함한 실제 기기와 시뮬레이터, 에뮬레이터와 같은 가상 머신을 모두 지원하기 때문에 이용자가 원하는 환경에서 UI Testing을 돌려볼 수 있습니다. 

( * *iOS 기기 사용을 위해서는 **Mac OS**를 필요로 합니다.*)



## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
	- [Environment](#environment)
	- [설치 및 실행](#install-and-run)
3. [구조](#structure)
	- [Honey-Farm Master](#honey-farm-master)
	- [Honey-Farm Node](#honey-farm-node)
	- [Test Runner](#test-runner)
4. [데모](#demo)


## Introduction

### 기존 테스팅 플래폼 (ex. Saucelab, AWS Device Farm etc..) 과의 차이점
- 사용자가 원할 때 언제든지 사용할 수 있습니다.
> Saucelab의 경우 사용하고 싶은 기기의 상태가 "busy" 일 경우 바로 사용을 할 수 없으며, 사용할 시에도 상당한 딜레이가 있어 제때 사용할 수 없는 이슈가 있었습니다.
- 사용자가 원하는 기기와 환경에서 테스트해 볼 수 있습니다.
> 같은 기기라도 OS 버전 혹은 DPI가 다를 수 있는데, 사용자가 원하는 그대로의 환경을 테스트해보기에는 한계가 존재했습니다.
> 또한, 클라우드 서비스 이용 시, 최근 들어 나오는 다양한 폼팩터 형태의 (갤럭시 폴드, LG 윙) 경우에는 직접 기기를 열고 닫을 수 없는 이슈가 있었습니다.
- 기기의 모든 기능에 접근해 볼 수 있습니다.
> Saucelab의 경우, 사용자가 컨트롤할 수 없는 부분이 상당수 존재하였습니다. 
> (ex. 기기에 이미지를 업로드 할 수가 없었습니다.)
 


## Quick Start

### Environment
1. **HoneyFarm-Master** 
- NodeJS
	```sh
	$ brew install node@12
	```


2. #### HoneyFarm-Node
- [appium-doctor](https://github.com/appium/appium-doctor](https://github.com/appium/appium-doctor))를 통해 `necessary dependencies` 확인 가능
	```sh
	$ npm install -g appium-doctor
	$ appium-doctor
	```

<br/>

### Install and Run

`HoneyFarm-Master`, `HoneyFarm-Node`, `Test-Runner` 는 각각 독립적으로 실행이 되기 때문에, 설치 또한 독립적으로 해주어야 합니다. (* 각 부분에 대한 추가 설명과 구조는 하기의 [구조](#structure) 섹션 참고)


1. #### HoneyFarm-Master 
```sh
$ cd master

# local 실행 시, 4723포트에서 시작 됨
$ yarn dev

# 배포 시,
$ yarn build
$ yarn start
```

2. #### HoneyFarm-Node 
*Optional*: `--endpoint-url`, `--appiumPort`, `--maxDevices`, `--useChromium`
```sh
$ cd node

# local 실행 시, 지정 endpoint-url에서 시작 됨
$ yarn dev

# 배포 시,
$ yarn build
$ yarn start
```

3. #### Test-Runner
```sh
$ cd testrunner

# 안드로이드 테스트
$ yarn test:android

# iOS 테스트
$ yarn test:ios
```


## Structure

![](https://mermaid.ink/svg/eyJjb2RlIjoiZ3JhcGggTFJcbkFbVGVzdC1SdW5uZXJdIC0tIO2FjOyKpO2KuCDsvIDsnbTsiqQ8YnIvPu2FjOyKpO2KuCDtlaAg6riw6riw7J2YIOyKpO2OmTo8YnIvPu2UjOueq-2PvCwg6riw6riwIOuyhOyghCDrk7EgLS0-IEJbSG9uZXlmYXJtLU1hc3Rlcl1cbkIgLS0g7YWM7Iqk7Yq4IOy8gOydtOyKpCAtLT4gQ1tIb25leUZhcm0tTm9kZV1cbkMgLS0g7Jew6rKw65CcIOq4sOq4sOydmCDsoJXrs7Q6PGJyLz7tlIzrnqvtj7wsIOuyhOyghCwg7IOB7YOcLCBVRElEIOuTsSAtLT4gQlxuQyAtLS0gRChHYWxheHkgUzIwKVxuQyAtLS0gRShpUGhvbmUgWClcbkMgLS0tIEYoTEcgRzgpXG5DIC0tLSBHKGlQaG9uZSAxMikiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCIsInRoZW1lVmFyaWFibGVzIjp7ImJhY2tncm91bmQiOiJ3aGl0ZSIsInByaW1hcnlDb2xvciI6IiNFQ0VDRkYiLCJzZWNvbmRhcnlDb2xvciI6IiNmZmZmZGUiLCJ0ZXJ0aWFyeUNvbG9yIjoiaHNsKDgwLCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJwcmltYXJ5Qm9yZGVyQ29sb3IiOiJoc2woMjQwLCA2MCUsIDg2LjI3NDUwOTgwMzklKSIsInNlY29uZGFyeUJvcmRlckNvbG9yIjoiaHNsKDYwLCA2MCUsIDgzLjUyOTQxMTc2NDclKSIsInRlcnRpYXJ5Qm9yZGVyQ29sb3IiOiJoc2woODAsIDYwJSwgODYuMjc0NTA5ODAzOSUpIiwicHJpbWFyeVRleHRDb2xvciI6IiMxMzEzMDAiLCJzZWNvbmRhcnlUZXh0Q29sb3IiOiIjMDAwMDIxIiwidGVydGlhcnlUZXh0Q29sb3IiOiJyZ2IoOS41MDAwMDAwMDAxLCA5LjUwMDAwMDAwMDEsIDkuNTAwMDAwMDAwMSkiLCJsaW5lQ29sb3IiOiIjMzMzMzMzIiwidGV4dENvbG9yIjoiIzMzMyIsIm1haW5Ca2ciOiIjRUNFQ0ZGIiwic2Vjb25kQmtnIjoiI2ZmZmZkZSIsImJvcmRlcjEiOiIjOTM3MERCIiwiYm9yZGVyMiI6IiNhYWFhMzMiLCJhcnJvd2hlYWRDb2xvciI6IiMzMzMzMzMiLCJmb250RmFtaWx5IjoiXCJ0cmVidWNoZXQgbXNcIiwgdmVyZGFuYSwgYXJpYWwiLCJmb250U2l6ZSI6IjE2cHgiLCJsYWJlbEJhY2tncm91bmQiOiIjZThlOGU4Iiwibm9kZUJrZyI6IiNFQ0VDRkYiLCJub2RlQm9yZGVyIjoiIzkzNzBEQiIsImNsdXN0ZXJCa2ciOiIjZmZmZmRlIiwiY2x1c3RlckJvcmRlciI6IiNhYWFhMzMiLCJkZWZhdWx0TGlua0NvbG9yIjoiIzMzMzMzMyIsInRpdGxlQ29sb3IiOiIjMzMzIiwiZWRnZUxhYmVsQmFja2dyb3VuZCI6IiNlOGU4ZTgiLCJhY3RvckJvcmRlciI6ImhzbCgyNTkuNjI2MTY4MjI0MywgNTkuNzc2NTM2MzEyOCUsIDg3LjkwMTk2MDc4NDMlKSIsImFjdG9yQmtnIjoiI0VDRUNGRiIsImFjdG9yVGV4dENvbG9yIjoiYmxhY2siLCJhY3RvckxpbmVDb2xvciI6ImdyZXkiLCJzaWduYWxDb2xvciI6IiMzMzMiLCJzaWduYWxUZXh0Q29sb3IiOiIjMzMzIiwibGFiZWxCb3hCa2dDb2xvciI6IiNFQ0VDRkYiLCJsYWJlbEJveEJvcmRlckNvbG9yIjoiaHNsKDI1OS42MjYxNjgyMjQzLCA1OS43NzY1MzYzMTI4JSwgODcuOTAxOTYwNzg0MyUpIiwibGFiZWxUZXh0Q29sb3IiOiJibGFjayIsImxvb3BUZXh0Q29sb3IiOiJibGFjayIsIm5vdGVCb3JkZXJDb2xvciI6IiNhYWFhMzMiLCJub3RlQmtnQ29sb3IiOiIjZmZmNWFkIiwibm90ZVRleHRDb2xvciI6ImJsYWNrIiwiYWN0aXZhdGlvbkJvcmRlckNvbG9yIjoiIzY2NiIsImFjdGl2YXRpb25Ca2dDb2xvciI6IiNmNGY0ZjQiLCJzZXF1ZW5jZU51bWJlckNvbG9yIjoid2hpdGUiLCJzZWN0aW9uQmtnQ29sb3IiOiJyZ2JhKDEwMiwgMTAyLCAyNTUsIDAuNDkpIiwiYWx0U2VjdGlvbkJrZ0NvbG9yIjoid2hpdGUiLCJzZWN0aW9uQmtnQ29sb3IyIjoiI2ZmZjQwMCIsInRhc2tCb3JkZXJDb2xvciI6IiM1MzRmYmMiLCJ0YXNrQmtnQ29sb3IiOiIjOGE5MGRkIiwidGFza1RleHRMaWdodENvbG9yIjoid2hpdGUiLCJ0YXNrVGV4dENvbG9yIjoid2hpdGUiLCJ0YXNrVGV4dERhcmtDb2xvciI6ImJsYWNrIiwidGFza1RleHRPdXRzaWRlQ29sb3IiOiJibGFjayIsInRhc2tUZXh0Q2xpY2thYmxlQ29sb3IiOiIjMDAzMTYzIiwiYWN0aXZlVGFza0JvcmRlckNvbG9yIjoiIzUzNGZiYyIsImFjdGl2ZVRhc2tCa2dDb2xvciI6IiNiZmM3ZmYiLCJncmlkQ29sb3IiOiJsaWdodGdyZXkiLCJkb25lVGFza0JrZ0NvbG9yIjoibGlnaHRncmV5IiwiZG9uZVRhc2tCb3JkZXJDb2xvciI6ImdyZXkiLCJjcml0Qm9yZGVyQ29sb3IiOiIjZmY4ODg4IiwiY3JpdEJrZ0NvbG9yIjoicmVkIiwidG9kYXlMaW5lQ29sb3IiOiJyZWQiLCJsYWJlbENvbG9yIjoiYmxhY2siLCJlcnJvckJrZ0NvbG9yIjoiIzU1MjIyMiIsImVycm9yVGV4dENvbG9yIjoiIzU1MjIyMiIsImNsYXNzVGV4dCI6IiMxMzEzMDAiLCJmaWxsVHlwZTAiOiIjRUNFQ0ZGIiwiZmlsbFR5cGUxIjoiI2ZmZmZkZSIsImZpbGxUeXBlMiI6ImhzbCgzMDQsIDEwMCUsIDk2LjI3NDUwOTgwMzklKSIsImZpbGxUeXBlMyI6ImhzbCgxMjQsIDEwMCUsIDkzLjUyOTQxMTc2NDclKSIsImZpbGxUeXBlNCI6ImhzbCgxNzYsIDEwMCUsIDk2LjI3NDUwOTgwMzklKSIsImZpbGxUeXBlNSI6ImhzbCgtNCwgMTAwJSwgOTMuNTI5NDExNzY0NyUpIiwiZmlsbFR5cGU2IjoiaHNsKDgsIDEwMCUsIDk2LjI3NDUwOTgwMzklKSIsImZpbGxUeXBlNyI6ImhzbCgxODgsIDEwMCUsIDkzLjUyOTQxMTc2NDclKSJ9fSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)

<br/>

1. #### HoneyFarm-Master 

- HoneyFarm-Master는 HoneyFarm-Node에 연결되어 있는 기기와 Test-Runner로부터 전달받은 request를 연결해주는 역할을 수행합니다. Test-Runner로부터 전달받은 테스트 케이스와 테스트 기기 스펙 정보에 맞는 기기를 HoneyFarm-Node를 통해 전달합니다.
- 아래와 같은 형식으로 HoneyFarm-Master를 통해 현재 사용 가능한 기기들의 리스트를 확인할 수 있습니다.

	```sh
	  "121.XXX.XXX.XX:4728": {
	    "platform": "android",
	    "version": "X.0",
	    "status": "FREE",
	    "udid": "XXXX-XXXX-XXXX"
	  },
	  
	  "121.XXX.XXX.XX:4729": {
	    "platform": "ios",
	    "version": "XX.0",
	    "status": "FREE",
	    "udid": "XXXXXX-XXXX-XXXX-XXXX-XXXXXXX",
	    "name": "iPhone X",
	    "wdaPort": "8101",
	    "mjpegServerPort": "9101",
	    "type": "simulator"
	  }
	```

<br/>

2. #### HoneyFarm-Node 

- HoneyFarm-Node는 기기가 물리적으로 연결이 되어 통신이 되는 부분입니다 
(* 안드로이드는 ADB / iOS는 XCRUN을 통해 연결됨)
- HoneyFarm-Node는 HoneyFarm-Master를 통해 전달받은 테스트케이스를 그에 맞는 기기로 실행을 합니다.
- 연결되어 있는 기기가 사용 가능한 상태일 경우 (아무런 테스트가 돌아가고 있지 않아 바로 사용이 가능한 상태) status는 `FREE`로 설정이 되어 있으며, 기기가 이미 사용 중일 때에는 `PENDING` / `RUNNING`으로  status가 변경됩니다. <br/>
	( * *iOS 기기 사용을 위해서는 **Mac OS**를 필요로 합니다.*)


<br/>

3. #### Test-Runner

- Test-Runner는 테스트 실행 시, 시작점이 되며 테스트 케이스 및 테스트하려는 기기의 정보들을 HoneyFarm-Master으로 전달합니다.
- 테스트 실행을 위한 기기정보 세팅은 `./configs`에서 하실 수 있으며, 안드로이드와 iOS를 별도로 설정해주어야 합니다.
	( * *iOS 시뮬레이터가 아닌 실제 기기 사용을 위해서는 추가적인 설정이 필요합니다. 자세한 사항은 [링크](http://appium.io/docs/en/drivers/ios-xcuitest-real-devices/)를 참고 바람*)
-  샘플 테스트는 `src/example_testcase.ts`에서 확인하실 수 있으며, 테스트 방법에 대한 더 구체적인 설명은 [Appium 사이트](http://appium.io/docs/en/commands/status/)를 확인해주세요.

<br/>

## Demo

![demo](demo.gif)


## Contributing

사용 중 개선사항 혹은 버그 제보는 [이슈 리포팅](https://github.com/zigbang/honeyfarm) 또는 PR 부탁드립니다.