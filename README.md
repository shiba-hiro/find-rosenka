# find-rosenka

A sample project to use puppeteer to download PDFs from [路線価図](https://www.rosenka.nta.go.jp/).

## Usage

```shell
git clone git@github.com:shiba-hiro/find-rosenka.git
cd find-rosenka
yarn install
yarn start
```

Then you can find PDFs in the `output` folder.


You can pass the address to fetch by setting the environment variable.  
(default value is `東京都千代田区千代田１−１`)  
e.g.  
```shell
INPUT=京都府京都市東山区清水２９４ yarn start
```

You can remove files in `output` folder by;
```
yarn clean
```

## Debug

```shell
yarn debug
```
