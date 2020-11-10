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
![](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgQSBhcyBBcHBpdW0gQ2xpZW50XG4gICAgcGFydGljaXBhbnQgQiBhcyBIb25leUZhcm0tTWFzdGVyPGJyPihBcHBpdW0gcHJveHkpXG4gICAgcGFydGljaXBhbnQgQyBhcyBIb25leUZhcm0tTm9kZTxicj4oQXBwaXVtIHNlcnZlcilcbiAgICBsb29wIDEwIHNlY29uZHNcbiAgICAgICAgQy0-PitCOiBkZXZpY2UgcmVnaXN0ZXIgb3IgZGV2aWNlIGRlcmVnaXN0ZXJcbiAgICBlbmRcbiAgICBBLT4-K0I6Y3JlYXRlIHNlc3Npb25cbiAgICBOb3RlIHJpZ2h0IG9mIEEgOiB7cGxhdGZvcm0sIHBsYXRmb3JtVmVyc2lvbn1cbiAgICBCLT4-K0M6cHJveGllZCBjcmVhdGUgc2Vzc2lvblxuICAgXG4gICAgTm90ZSByaWdodCBvZiBCOnsgcGxhdGZvcm0sIHBsYXRmb3JtVmVyc2lvbiwgdWRpZCwgd2RhTG9jYWxQb3J0LCBtanBlZ1NlcnZlclBvcnQgLi4gfVxuICAgIGxvb3AgVGVzdFxuICAgICAgICBBLT4-K0I6IHJlcXVlc3RcbiAgICAgICAgQi0-PitDOiBwcm94aWVkIHJlcXVlc3RcbiAgICAgICAgQy0-PitCOiByZXNwb25zZVxuICAgICAgICBCLT4-K0E6IHByb3hpZWQgcmVzcG9uc2VcbiAgICBlbmRcbiAgICBDLT4-KyBCOiBkZWxldGUgc2Vzc2lvblxuICAgIEItPj4rIEE6IHByb3hpZWQgZGVsZXRlIHNlc3Npb25cblxuICAgICAgICAgICAgIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQiLCJ0aGVtZVZhcmlhYmxlcyI6eyJiYWNrZ3JvdW5kIjoid2hpdGUiLCJwcmltYXJ5Q29sb3IiOiIjRUNFQ0ZGIiwic2Vjb25kYXJ5Q29sb3IiOiIjZmZmZmRlIiwidGVydGlhcnlDb2xvciI6ImhzbCg4MCwgMTAwJSwgOTYuMjc0NTA5ODAzOSUpIiwicHJpbWFyeUJvcmRlckNvbG9yIjoiaHNsKDI0MCwgNjAlLCA4Ni4yNzQ1MDk4MDM5JSkiLCJzZWNvbmRhcnlCb3JkZXJDb2xvciI6ImhzbCg2MCwgNjAlLCA4My41Mjk0MTE3NjQ3JSkiLCJ0ZXJ0aWFyeUJvcmRlckNvbG9yIjoiaHNsKDgwLCA2MCUsIDg2LjI3NDUwOTgwMzklKSIsInByaW1hcnlUZXh0Q29sb3IiOiIjMTMxMzAwIiwic2Vjb25kYXJ5VGV4dENvbG9yIjoiIzAwMDAyMSIsInRlcnRpYXJ5VGV4dENvbG9yIjoicmdiKDkuNTAwMDAwMDAwMSwgOS41MDAwMDAwMDAxLCA5LjUwMDAwMDAwMDEpIiwibGluZUNvbG9yIjoiIzMzMzMzMyIsInRleHRDb2xvciI6IiMzMzMiLCJtYWluQmtnIjoiI0VDRUNGRiIsInNlY29uZEJrZyI6IiNmZmZmZGUiLCJib3JkZXIxIjoiIzkzNzBEQiIsImJvcmRlcjIiOiIjYWFhYTMzIiwiYXJyb3doZWFkQ29sb3IiOiIjMzMzMzMzIiwiZm9udEZhbWlseSI6IlwidHJlYnVjaGV0IG1zXCIsIHZlcmRhbmEsIGFyaWFsIiwiZm9udFNpemUiOiIxNnB4IiwibGFiZWxCYWNrZ3JvdW5kIjoiI2U4ZThlOCIsIm5vZGVCa2ciOiIjRUNFQ0ZGIiwibm9kZUJvcmRlciI6IiM5MzcwREIiLCJjbHVzdGVyQmtnIjoiI2ZmZmZkZSIsImNsdXN0ZXJCb3JkZXIiOiIjYWFhYTMzIiwiZGVmYXVsdExpbmtDb2xvciI6IiMzMzMzMzMiLCJ0aXRsZUNvbG9yIjoiIzMzMyIsImVkZ2VMYWJlbEJhY2tncm91bmQiOiIjZThlOGU4IiwiYWN0b3JCb3JkZXIiOiJoc2woMjU5LjYyNjE2ODIyNDMsIDU5Ljc3NjUzNjMxMjglLCA4Ny45MDE5NjA3ODQzJSkiLCJhY3RvckJrZyI6IiNFQ0VDRkYiLCJhY3RvclRleHRDb2xvciI6ImJsYWNrIiwiYWN0b3JMaW5lQ29sb3IiOiJncmV5Iiwic2lnbmFsQ29sb3IiOiIjMzMzIiwic2lnbmFsVGV4dENvbG9yIjoiIzMzMyIsImxhYmVsQm94QmtnQ29sb3IiOiIjRUNFQ0ZGIiwibGFiZWxCb3hCb3JkZXJDb2xvciI6ImhzbCgyNTkuNjI2MTY4MjI0MywgNTkuNzc2NTM2MzEyOCUsIDg3LjkwMTk2MDc4NDMlKSIsImxhYmVsVGV4dENvbG9yIjoiYmxhY2siLCJsb29wVGV4dENvbG9yIjoiYmxhY2siLCJub3RlQm9yZGVyQ29sb3IiOiIjYWFhYTMzIiwibm90ZUJrZ0NvbG9yIjoiI2ZmZjVhZCIsIm5vdGVUZXh0Q29sb3IiOiJibGFjayIsImFjdGl2YXRpb25Cb3JkZXJDb2xvciI6IiM2NjYiLCJhY3RpdmF0aW9uQmtnQ29sb3IiOiIjZjRmNGY0Iiwic2VxdWVuY2VOdW1iZXJDb2xvciI6IndoaXRlIiwic2VjdGlvbkJrZ0NvbG9yIjoicmdiYSgxMDIsIDEwMiwgMjU1LCAwLjQ5KSIsImFsdFNlY3Rpb25Ca2dDb2xvciI6IndoaXRlIiwic2VjdGlvbkJrZ0NvbG9yMiI6IiNmZmY0MDAiLCJ0YXNrQm9yZGVyQ29sb3IiOiIjNTM0ZmJjIiwidGFza0JrZ0NvbG9yIjoiIzhhOTBkZCIsInRhc2tUZXh0TGlnaHRDb2xvciI6IndoaXRlIiwidGFza1RleHRDb2xvciI6IndoaXRlIiwidGFza1RleHREYXJrQ29sb3IiOiJibGFjayIsInRhc2tUZXh0T3V0c2lkZUNvbG9yIjoiYmxhY2siLCJ0YXNrVGV4dENsaWNrYWJsZUNvbG9yIjoiIzAwMzE2MyIsImFjdGl2ZVRhc2tCb3JkZXJDb2xvciI6IiM1MzRmYmMiLCJhY3RpdmVUYXNrQmtnQ29sb3IiOiIjYmZjN2ZmIiwiZ3JpZENvbG9yIjoibGlnaHRncmV5IiwiZG9uZVRhc2tCa2dDb2xvciI6ImxpZ2h0Z3JleSIsImRvbmVUYXNrQm9yZGVyQ29sb3IiOiJncmV5IiwiY3JpdEJvcmRlckNvbG9yIjoiI2ZmODg4OCIsImNyaXRCa2dDb2xvciI6InJlZCIsInRvZGF5TGluZUNvbG9yIjoicmVkIiwibGFiZWxDb2xvciI6ImJsYWNrIiwiZXJyb3JCa2dDb2xvciI6IiM1NTIyMjIiLCJlcnJvclRleHRDb2xvciI6IiM1NTIyMjIiLCJjbGFzc1RleHQiOiIjMTMxMzAwIiwiZmlsbFR5cGUwIjoiI0VDRUNGRiIsImZpbGxUeXBlMSI6IiNmZmZmZGUiLCJmaWxsVHlwZTIiOiJoc2woMzA0LCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJmaWxsVHlwZTMiOiJoc2woMTI0LCAxMDAlLCA5My41Mjk0MTE3NjQ3JSkiLCJmaWxsVHlwZTQiOiJoc2woMTc2LCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJmaWxsVHlwZTUiOiJoc2woLTQsIDEwMCUsIDkzLjUyOTQxMTc2NDclKSIsImZpbGxUeXBlNiI6ImhzbCg4LCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJmaWxsVHlwZTciOiJoc2woMTg4LCAxMDAlLCA5My41Mjk0MTE3NjQ3JSkifX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)
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