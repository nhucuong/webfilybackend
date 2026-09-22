$(document).ready(function () {

  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

 const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    autoWidth: false, 
    ajax: "/webhistoryjson",
    columns: [

      // User
      {
        data: "user",
        render: u => u ? `${u}` : "Deleted User"
      },

      // Category
      {
        data: "category",
        render:(c)=>
        c
      },

      // Website Name
      {
        data: "websiteName",
        render:(c)=>
        c
      },
        {
      data: "isPublished",
      render: s => {
        if (s) {
          return `<span class="badge bg-success">Generated</span>`;
        } else {
          return `<span class="badge bg-danger">Draft</span>`;
        }
      }
    },

      // Created At
      {
        data: "createdAt",
        render: d => d ? new Date(d).toLocaleString() : "-"
      },

      // Action Dropdown
      {
        data: "_id",
        className: "text-center",
        render: (id,type,row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
          ${
            row.isPublished 
            ? `<a href="${row.zipUrl}" class="dropdown-item" download>
                 <i class="fa-solid fa-download text-info me-2"></i>Download
               </a>` 
            : `<a href="javascript:" class="dropdown-item disabled-link">
                 <i class="fa-solid fa-download text-info me-2"></i>Download
               </a>` 
          }
        </li>
              <li>
          ${
            row.isPublished 
            ? `<a href="${row.previewUrl}" class="dropdown-item" target="_blank">
                 <i class="bi bi-eye-fill text-info me-2"></i>Preview
               </a>` 
            :`<a href="javascript:" class="dropdown-item disabled-link">
                 <i class="bi bi-eye-fill text-info me-2"></i>Preview
               </a>`
          }
        </li>
            </ul>
          </div>
        `
      }

    ],
    order: []
});


 // -----------------------------
  // FIXED REFRESH BUTTON
  // -----------------------------
  setTimeout(() => {
    const searchContainer = $("#zero_config_filter");
    if (searchContainer.length && !$("#refreshTableBtn").length) {
      searchContainer.addClass("d-flex justify-content-end gap-2").append(`
        <button id="refreshTableBtn" class="btn btn-sm btn-outline-secondary ms-2" title="Refresh Table">
          <i class="fa fa-rotate"></i>
        </button>
      `);
    }
  }, 300);

  // Refresh table on button click
  $(document).on("click", "#refreshTableBtn", function () {
    table.ajax.reload(null, false); // reload without resetting pagination
  });

});
