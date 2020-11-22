# trace-covid-19-backend-v2

### 0. Purpose

- 명지대학교 컴퓨터공학과 고급객체지향프로그래밍 교과목 프로젝트입니다.
- 서울시 코로나19 확진자 현황 조회를 위한 API 서버입니다.
- [trace-covid-19-backend](https://github.com/advanced-oop-13circle-team/trace-covid-19-backend)의 용두사미 버전입니다.
---
### 1. Features

- 확진자 데이터 관련 API
  - /covid19data/upload: 확진자 데이터 CSV 파일 업로드
  - /covid19data/download: 확진자 데이터 CSV 파일 다운로드
  - /covid19data/count-district-data: 지역구별 확진자 수를 조회
  - /covid19data/district-data/:district: 해당 지역구의 확진자 현황을 조회
- 부가기능 관련 API
  - /misc/license: 라이센스 확인
- Summary
  |                 API                 | Method |             Request Params/Body             |            Response Body            |
  |:-----------------------------------:|:------:|:-------------------------------------------:|:-----------------------------------:|
  |   /covid19data/count-district-data  |   GET  |                     N/A                     |      { err, is_cnt, cnts, msg }     |
  | /covid19data/distrct-data/:district |   GET  |                   district                  |   { err, is_data, cnt_data, msg }   |
  |         /covid19data/upload         |  POST  |                { covid19csv }               |       { err, is_upload, msg }       |
  |        /covid19data/download        |  POST  |                     N/A                     |    { err, is_download, csv, msg }   |
  |            /misc/license            |   GET  |                     N/A                     |  { err, is_license, license, msg }  |

---
### 2. How to use

1. ```
   git clone https://github.com/advanced-oop-13circle-team/trace-covid-19-backend.git
   cd trace-covid-19-backend
   ```
2. ```
   yarn global add pm2
   ```
3. ```
   yarn
   ```
4. ```
   pm2 start pm2.config.js
   ```
---
### 3. Development Stack
- Express
  - 본 프로젝트에서 사용하는 서버입니다.
- module-alias
  - require 구문에서 가독성을 떨어뜨리는 상대경로를 사용하지 않고 alias 경로를 지정하기 위해서 사용했습니다.
- express-fileupload
  - Express에서 사용자로부터 파일을 업로드하기 위해서 사용했습니다.
- csvtojson & convert-array-to-csv
  - Node.js에서 CSV 파일을 다루기 위해서 사용했습니다.
- iconv-lite
  - CSV 파일을 다룰 때 발생하기 쉬운 인코딩 문제를 해결하기 위해서 사용했습니다.
- dotenv
  - .env 파일에 저장된 환경변수들을 위해서 사용했습니다.
---
### 4. LICENSE
- [MIT License](https://github.com/advanced-oop-13circle-team/trace-covid-19-backend/blob/master/LICENSE)
