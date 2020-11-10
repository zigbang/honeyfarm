# HoneyFarm

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
	- [Prerequisite](#Prerequisite)
	- [install and run](#install-and-run)
3. [API](#api)

## Introduction

### HoneyFarm이란
Appium Client와 Appium Server 사이에 honeyfarm을 두고 단말 관리와 다중 테스트를 편리하게 도와주는 모듈입니다.

![workflow](./docs/workflow.png)

### HoneyFarm 장점
1. master를 통해 복수의 단말을 관리합니다.
	- master가 node를 통해 등록된 단말을 관리하기 때문에 사용자 입장에서 master와 통신만 하면 됩니다.
2. 다중 테스트를 진행하는데 최소한의 설정으로 진행이 가능합니다. (*참고 [Appium Parallel Tests](http://appium.io/docs/en/advanced-concepts/parallel-tests/)*)
	- platform과 plartformVersion만 설정하면 master에서 mjpegServerPort, wdaLocalPort, udid등을 자동으로 할당합니다. udid를 추가해서 특정 단말을 선택할 수도 있습니다.
3. Appium에서 지원하지 않는 `plartformVersion: *`를 지원합니다.
4. 직접 실기기 및 에뮬레이터, 시뮬레이터를 사용하기 때문에 다른 테스팅 플랫폼과 다르게 단말의 모든 기능을 사용할 수 있습니다.
	

## Quick Start
### Prerequisite
1. **공통** 
	NodeJS >= 10

2. **honeyfarm-node** 
	[appium](http://appium.io/docs/en/about-appium/getting-started/)

### Install and Run

#### HoneyFarm-Master (*master의 port는 `4723`으로 `appium default port`와 동일합니다.*)
```sh
$ npm install @zigbang/honeyfarm-master
$ npx honeyfarm-master
```

#### HoneyFarm-Node 
```sh
$ npm install @zigbang/honeyfarm-node
$ npx honeyfarm-node
```

| options | description | default |
|:---|:---|:---|
| --endpoint-url | honeyfarm-master endpoint|`localhost:4723`|
| --appiumBeginPort|appium이 사용 할 시작 포트|`4724`|

## API
#### HoneyFarm-Master
| api | description | example |
|:---|:---|:---|
| (GET)`/devices` | 현재 등록된 단말 목록 |`localhost:4723/devices`|