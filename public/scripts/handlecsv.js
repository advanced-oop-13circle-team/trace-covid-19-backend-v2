var btnSubmit = document.getElementById("submit");

btnSubmit.onclick = function(e) {
  handleCSV();
};

function handleCSV() {
  var covid19csv = document.getElementById("covid19csv");
  var formData = new FormData();

  if(!covid19csv.value) {
    alert("Please select your file");
    return;
  }

  formData.append("covid19csv", covid19csv.files[0]);

  var xhr = new XMLHttpRequest();
  xhr.onload = function(e) {
    alert(xhr.responseText);
  };
  xhr.open("POST", "/covid19data/upload", true);
  xhr.send(formData);
};

