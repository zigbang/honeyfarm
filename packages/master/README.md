# HoneyFarm Master

## DASH BOARD
HoneyFarm Node에 등록 되어 있는 안드로이드 단말을 웹페이지에서 실시간으로 확인 및 사용 할수 있도록 구현된 웹

## CONFIG OPTIONS
config.json file을 root에 추가해서 단말을 설정하기 위한 옵션

### DEVICES
 ```
    [ 
        { "udid": "R3CN90NZ2SK", "name": "Galaxy z Fold2", "showInDashboard": true },
        { "udid": "R3CN70DJEXV", "name": "Galaxy Note20 Ultra", "showInDashboard": false }
    ] 
``` 
|  | description |
|:---|:---|:---|:---|
| udid | udid |
| name | device model name |
| showInDashboard | true일 경우 테스트용 단말이 아닌 dashboard에서만 사용 하는 단말로 정의 |

## API

| path | description | example | params |
|:---|:---|:---|:---|
| (GET)`/devices` | 현재 등록된 테스트용 단말 목록 |`localhost:4723/devices`| all : true 모든 단말 표시|

