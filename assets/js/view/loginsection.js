$(document).ready(function () {

  // Toastr Config
  if (window.toastr) {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-right",
      timeOut: "3000"
    };
  }

  // ===============================
  // LOAD SECTION
  // ===============================
  function loadSection(type) {
    $("#authSectionForm")[0].reset();
    $("#previewImage").hide();

    $.get(`/sectionjson/${type}`, function (res) {
      $("#sectionType").val(type);

      if (res.success && res.data) {
        $("#sectionTitle").val(res.data.title || "");
        $("#sectionDescription").val(res.data.shortDescription || "");

        if (res.data.image) {
          $("#previewImage").attr("src", res.data.image).show();
        }

        // ===== LOGIN =====
        if (type === "login") {
          $("#loginLabelsWrapper").show();
          $("#signupLFWrapper").hide();

          $("#loginLabelsContainer").html("");
          loginRoom = 0;

          (res.data.labels && res.data.labels.length ? res.data.labels : [""])
            .forEach(l => addLoginLabelField(l));
        }

        // ===== SIGNUP =====
        else {
          $("#loginLabelsWrapper").hide();
          $("#signupLFWrapper").show();

          $("#signupLFContainer").html("");
          signupRoom = 0;

          const labels = res.data.labels || [];
          const features = res.data.features ? res.data.features.split(",") : [];

          const max = Math.max(labels.length, features.length, 1);
          for (let i = 0; i < max; i++) {
            addSignupLFField(labels[i] || "", features[i] || "");
          }
        }
      } else {
        if (type === "login") {
          $("#loginLabelsWrapper").show();
          $("#signupLFWrapper").hide();
          addLoginLabelField("");
        } else {
          $("#loginLabelsWrapper").hide();
          $("#signupLFWrapper").show();
          addSignupLFField("", "");
        }
      }
    });
  }

  loadSection("login");

  // ===============================
  // TAB SWITCH
  // ===============================
  $(".nav-link").on("click", function () {
    $(".nav-link").removeClass("active");
    $(this).addClass("active");
    loadSection($(this).data("type"));
  });

  // ===============================
  // IMAGE PREVIEW
  // ===============================
  $("#sectionImage").on("change", function () {
    const f = this.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => $("#previewImage").attr("src", e.target.result).show();
    r.readAsDataURL(f);
  });

  // ===============================
  // LOGIN LABELS
  // ===============================
  let loginRoom = 0;

  function addLoginLabelField(val = "") {
    loginRoom++;
    $("#loginLabelsContainer").append(`
      <div class="mb-2 removeLogin${loginRoom}">
        <div class="input-group">
          <input class="form-control loginLabelInput" value="${val}" placeholder="Label" required>
          <button class="btn btn-outline-danger" type="button"
            onclick="removeLoginRow(${loginRoom})">
            <i class="fa fa-minus"></i>
          </button>
        </div>
      </div>
    `);
  }

  $("#addLoginLabelBtn").click(() => addLoginLabelField(""));

  window.removeLoginRow = function (id) {
    $(".removeLogin" + id).remove();

    //  ALWAYS KEEP ONE ROW
    if ($(".loginLabelInput").length === 0) {
      addLoginLabelField("");
    }
  };

  // ===============================
  // SIGNUP LABEL + FEATURE
  // ===============================
  let signupRoom = 0;

  function addSignupLFField(label = "", feature = "") {
    signupRoom++;
    $("#signupLFContainer").append(`
      <div class="mb-2 removeSignup${signupRoom}">
        <div class="row g-2">
          <div class="col">
            <input class="form-control signupFeatureInput"
              value="${feature}" placeholder="Feature" required>
          </div>

          <div class="col">
            <input class="form-control signupLabelInput"
              value="${label}" placeholder="Label" required>
          </div>
          <div class="col-auto">
            <button class="btn btn-outline-danger" type="button"
              onclick="removeSignupRow(${signupRoom})">
              <i class="fa fa-minus"></i>
            </button>
          </div>
        </div>
      </div>
    `);
  }

  $("#addSignupLFBtn").click(() => addSignupLFField("", ""));

  window.removeSignupRow = function (id) {
    $(".removeSignup" + id).remove();

    //  ALWAYS KEEP ONE ROW
    if ($(".signupLabelInput").length === 0) {
      addSignupLFField("", "");
    }
  };
 // ===============================
  // AI GENERATE DESCRIPTION (LOGIN + SIGNUP)
  // ===============================
$("#generateLoginSectionAI").on("click", function () {
  const title = $("#sectionTitle").val().trim();
  const type = $("#sectionType").val(); // login / signup

  if (!title) {
    toastr.warning("Please enter title first");
    return;
  }

  // ===============================
  // DIFFERENT PROMPTS
  // ===============================
  let prompt = "";

  if (type === "login") {
    prompt = `
Write a professional and user-friendly LOGIN page description for "${title}".
Explain ease of access, security, and quick authentication.
Tone should be simple, trustworthy, and welcoming.
Limit to 80–100 words.
`;
  } else if (type === "signup") {
    prompt = `
Write an engaging SIGNUP page description for "${title}".
Highlight benefits of creating an account, features access, and user advantages.
Tone should be encouraging and persuasive.
Limit to 80–100 words.
`;
  }

  const loadingToast = toastr.info(
        "AI is writing description...",
        "Please wait",
        { timeOut: 0, extendedTimeOut: 0 }
    );

  $.ajax({
    url: "/generateDescription",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      name: title, 
      prompt: prompt 
    }),
    success: function (res) {
      toastr.clear(loadingToast);
      if (!res.success) {
        toastr.error(res.message || "AI failed");
        return;
      }

      $("#sectionDescription").val(res.description);
      toastr.success("Description generated successfully");
    },
    error: function () {
        toastr.clear(loadingToast);
      toastr.error("AI generation failed");
    }
  });
});

  // ===============================
  // SAVE FORM
  // ===============================
  $("#authSectionForm").submit(function (e) {
    e.preventDefault();

    const type = $("#sectionType").val();
    const fd = new FormData(this);

    if (type === "login") {
      const labelsArr = $(".loginLabelInput").map((_, i) => $(i).val()).get();
      fd.append("labels", JSON.stringify(labelsArr));
    } else {
       const featuresArr = $(".signupFeatureInput").map((_, i) => $(i).val()).get();
      const labelsArr = $(".signupLabelInput").map((_, i) => $(i).val()).get();

      fd.append("features", featuresArr.join(","));
      fd.append("labels", JSON.stringify(labelsArr));
    
    }

    const $submitBtn = $("#authSectionForm button[type='submit']");
    const originalBtnContent = $submitBtn.html();
    $submitBtn.prop("disabled", true);
    $submitBtn.html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`); // <-- NEW: spinner inside button


    $.ajax({
      url: "/savesection",
      type: "POST",
      data: fd,
      contentType: false,
      processData: false,
      success: r =>{
      $submitBtn.prop("disabled", false).html(originalBtnContent); // <-- NEW: restore button
       r.success ? toastr.success(r.message) : toastr.error(r.message)
      },
      error: () =>{
          $submitBtn.prop("disabled", false).html(originalBtnContent); // <-- NEW: restore button even on error
          toastr.error("Something went wrong")
      }
    });
  });

});
