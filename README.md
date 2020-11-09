# HoneyFarm

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
	- [PreRequisite](#PreRequisite)
	- [install and run](#install-and-run)
3. [Contributing](#Contributing)


## Introduction
### honeyfarm이란
- appium을 기반으로 여러 단말을 관리하고 테스트를 진행할 수 있도록 지원해 주는 프로그램입니다.

</br>

### honeyfarm의 장점
- 복수 기기의 단말을 관리하기에 용의합니다.
> 노드에 단말에 연결 될때 마다 appium이 각기 다른 포트로 실행 되고 해당 정보가 마스터에 자동으로 업데이트 되서 확인 단말 정보를 확인 및 특정 할수 있습니다.
- 다중 테스트를 진행하는 데 편의성을 추가 했습니다. (*참고 [Appium Parallel Tests](http://appium.io/docs/en/advanced-concepts/parallel-tests/)*)
> 기존에 테스트를 진행하기 위해서는 platform version을 특정하지 않고 `*`로 보내도 현재 가용 가능한 단말 중 하나를 자동으로 매핑에서 테스트를 가능합니다.</br>
> 기기 연결시 mjpegServerPort, wdaLocalPort 자동으로 할당하기때문에 따로 지정할 필요가 없습니다.

</br>

### 기존 테스팅 플랫폼 (ex. Saucelab, AWS Device Farm etc..) 과의 차이점
- 사용자가 원할 때 언제든지 사용할 수 있습니다.
> Saucelab의 경우 사용하고 싶은 기기의 상태가 "busy" 일 경우 바로 사용을 할 수 없으며, 사용할 시에도 상당한 딜레이가 있어 제때 사용할 수 없는 이슈가 있었습니다.
- 사용자가 원하는 기기와 환경에서 테스트해 볼 수 있습니다.
> 같은 기기라도 OS 버전 혹은 DPI가 다를 수 있는데, 사용자가 원하는 그대로의 환경을 테스트해보기에는 한계가 존재했습니다.
> 또한, 클라우드 서비스 이용 시, 최근 들어 나오는 다양한 폼팩터 형태의 (갤럭시 폴드, LG 윙) 경우에는 직접 기기를 열고 닫을 수 없는 이슈가 있었습니다.
- 기기의 모든 기능에 접근해 볼 수 있습니다.
> Saucelab의 경우, 사용자가 컨트롤할 수 없는 부분이 상당수 존재하였습니다. 
> (ex. 기기에 이미지를 업로드 할 수가 없었습니다.)
 

## Quick Start

### PreRequisite
1. **공통** 
- NodeJS >= 10

2. **honeyfarm-node** 
- [appium](http://appium.io/docs/en/about-appium/getting-started/)

<br/>

### Install and Run

1. #### honeyfarm-master (*master의 port는 `4723`으로 `appium default port`와 동일합니다.*)
```sh
$ npm install @zigbang/honeyfarm-master
$ npx honeyfarm-master
```

<br/>

2. #### honeyfarm-node 
```sh
$ npm install @zigbang/honeyfarm-node
$ npx honeyfarm-node
```

| 옵션 | 설명 | 기본값 |
|:---:|:---:|:---:|
| `--endpoint-url` | honeyfarm-master endpoint | `localhost:4723` |
| `--appiumBeginPort` | appium이 사용 할 begin port |  `4724`|

<br/>

## Contributing

사용 중 개선사항 혹은 버그 제보는 [이슈 리포팅](https://github.com/zigbang/honeyfarm) 또는 PR 부탁드립니다.