InstallDependencies() {
    echo "InstallDeps"
    sudo apt update 
    sudo apt install nodejs npm --fix-missing -y
    sudo apt install -y android-tools-adb --fix-missing -y
    sudo apt install default-jdk --fix-missing -y
    sudo apt install android-sdk android-sdk-platform-23 --fix-missing -y
    sudo apt install screen --fix-missing -y
}

SetENV() {
    echo "Set ENV"
    mkdir .npm-global
    npm config set prefix '~/.npm-global'
    echo export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-armhf >> ~/.bashrc
    echo export ANDROID_HOME=/usr/lib/android-sdk  >> ~/.bashrc
    echo 'export PATH=$PATH:$ANDROID_HOME/tools'  >> ~/.bashrc
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools'  >> ~/.bashrc
    echo 'export PATH=~/.npm-global/bin:$PATH'  >> ~/.bashrc
    source ~/.bashrc
    echo $JAVA_HOME
    echo $ANDROID_HOME
    echo $PATH
}

InstallHoneyFarm() {
    npm -g install appium --unsafe-perm=true --allow-root
    npm -g install @zigbang/honeyfarm-node
}

InstallDependencies
SetENV
InstallHoneyFarm