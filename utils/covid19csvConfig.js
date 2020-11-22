const path = require("path");

const publicDir = path.join(process.cwd(), "public");
const getTime = () => (new Date()).getTime();

exports.csvFiles = {
  "TMP_CSV": path.join(publicDir, `covid19csv-${getTime()}.csv`),
  "TMP_JSON_TXT": path.join(publicDir, `output-${getTime()}.txt`)
};

exports.enumCovid19 = [
  [ "연번", "serial_no" ],
  [ "환자번호", "patient_no" ],
  [ "국적", "nationality" ],
  [ "환자정보", "patient_info" ],
  [ "지역", "district" ],
  [ "여행력", "travel_history" ],
  [ "접촉력", "contact_history" ],
  [ "조치사항", "action" ],
  [ "상태", "status" ],
  [ "이동경로", "route" ],
  [ "확진일", "confirmed_at" ],
  [ "등록일", "registered_at" ],
  [ "수정일", "updated_at" ]
];