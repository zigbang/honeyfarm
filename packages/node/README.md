# HoneyFarm Node

## Raspberry Pi HoneyFarm Node
### Setup && Run

* Raspberry Pi Imager를 사용하여 Raspberry Pi OS를 설치한다.
* Raspberry Pi OS가 설치된 폴더에 resources 폴더 아래 있는 `wpa_supplicant.conf`와 `ssh`을 복사한다.
    * wpa_supplicant.conf 파일은 네트워트 환경에 맞게 수정 필요
* Raspberry Pi를 구동하고 ssh로 들어간다.
* resources 폴더 아래 있는 install.sh를 Raspberry Pi로 복사한다.
* `source install.sh`를 실행한다.
* `screen -S honeyfarm`를 실행해 스크린을 만든다.
* `honeyfarm-node`를 실행한다.

## Options

| options | description | default |
|:---|:---|:---|
| --endpoint | honeyfarm-master endpoint|`localhost:4723`|
| --appiumBeginPort|appium이 사용 할 시작 포트|`4724`|
