# HoneyFarm Master

## DASH BOARD
HoneyFarm Node에 등록 되어 있는 안드로이드 단말을 웹페이지에서 실시간으로 확인 및 사용 할수 있도록 구현된 웹

## CONFIG OPTIONS
config.json file을 root에 추가해서 단말을 설정하기 위한 옵션

### 구조
```
{
    UDID : {
        "name" : "Galaxy z Fold2", //device model name
        "onlyUseDashboard": false //true 일경우 dashboard에서만 사용 할 단말로 구분
    },
    UDID2: {
        "name" : "Galaxy Note20 Ultra",
        "onlyUseDashboard": true
    }
}
```  
## API

| path | description | example | body |
|:---|:---|:---|:---|
| (GET)`/devices` | 현재 등록된 테스트용 단말 목록 |`localhost:4723/devices`| all : true 모든 단말 표시|

