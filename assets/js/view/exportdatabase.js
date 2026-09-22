
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  document.getElementById("exportDatabaseBtn").addEventListener("click", function () {

    const loadingToast = toastr.info(
        "Please wait, database export is in progress...", "Exporting",
        { timeOut: 0, extendedTimeOut: 0 }
    );

fetch("/exportdatabasezip", { method: "GET" })
  .then(response => {
    if (!response.ok) throw new Error("Export failed");
    return response.blob();
  })

    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exportdatabase.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
         toastr.clear(loadingToast);
      toastr.success("Database exported successfully", "Done");
    })
    .catch(() => {
      toastr.clear(loadingToast);
      toastr.error("Database export failed", "Error");
    });
  });

