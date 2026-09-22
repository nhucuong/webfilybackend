$(document).ready(function () {

  // ==========================
  // TOASTR CONFIG
  // ==========================
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  const modalEl = document.getElementById('reviewModal');
  const reviewModal = new bootstrap.Modal(modalEl);

  // ==========================
  // DATATABLE INIT
  // ==========================
  if ($.fn.DataTable.isDataTable("#testimonial_table")) {
    $("#testimonial_table").DataTable().clear().destroy();
  }

  const table = $("#testimonial_table").DataTable({
    ajax: { url: "/testimonialsjson", dataSrc: "data" },
    columns: [
      {
        data: "image",
        render: img =>
          img
            ? `<img src="${img}" style="height:60px;width:auto;">`
            : `<span class="text-muted">No Image</span>`
      },
      { data: "name" },
      { data: "username" },
      { data: "review" },
      { data: "rating" },
      {
        data: null,
        className: "text-center",
        render: row => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <button class="dropdown-item edit-btn" data-id="${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>
              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash me-2 text-danger"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        `
      }
    ],
    order: [],
    responsive: true,
    autoWidth: false
  });

  // ==========================
  // ADD REVIEW
  // ==========================
  $('#addReviewBtn').click(() => {
    $('#reviewForm')[0].reset();
    $('#reviewId').val('');
    $('#previewImage').hide().attr('src', '');
    $('#reviewModalLabel').text('Add Testimonial');
    reviewModal.show();
  });

  // ==========================
  // IMAGE PREVIEW
  // ==========================
  $('#reviewImage').change(function () {
    const file = this.files[0];
    if (!file) {
      $('#previewImage').hide().attr('src', '');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => $('#previewImage').attr('src', e.target.result).show();
    reader.readAsDataURL(file);
  });

  // ==========================
  // EDIT REVIEW
  // ==========================
  $('#testimonial_table').on('click', '.edit-btn', function () {
    const row = table.row($(this).closest('tr')).data();
    if (!row) {
      toastr.error("Data not found");
      return;
    }

    $('#reviewForm')[0].reset();
    $('#reviewId').val(row._id);
    $('#name').val(row.name);
    $('#username').val(row.username);
    $('#reviewText').val(row.review);
    $('#rating').val(row.rating || 5);

    if (row.image) {
      $('#previewImage').attr('src', row.image).show();
    } else {
      $('#previewImage').hide();
    }

    $('#reviewModalLabel').text('Edit Testimonial');
    reviewModal.show();
  });

  // ==========================
  // SAVE (ADD / UPDATE)
  // ==========================
  $('#reviewForm').submit(function (e) {
    e.preventDefault();

    const $submitBtn = $("#reviewForm button[type='submit']");
    const originalBtnContent = $submitBtn.html();
    $submitBtn.prop("disabled", true);
    $submitBtn.html(`
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    `);
    const fd = new FormData(this);
    const id = $('#reviewId').val();
    if (id) fd.append('id', id);

    $.ajax({
      url: '/testimonialssave',
      type: 'POST',
      data: fd,
      contentType: false,
      processData: false,
      success: res => {
        if (res.success) {
          toastr.success(res.message || "Saved successfully");
          reviewModal.hide();
          $('#reviewForm')[0].reset();
          $('#previewImage').hide().attr('src', '');
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Server error");
        }
      },
      error: xhr => {
        const msg = xhr.responseJSON?.message || "Something went wrong!";
        toastr.error(msg);
      },
       complete: () => {
        $submitBtn.prop("disabled", false);
        $submitBtn.html(originalBtnContent);
      }
    });
  });

  // ==========================
  // DELETE REVIEW (NO CONFIRM)
  // ==========================
  $('#testimonial_table').on('click', '.delete-btn', function () {
    const id = $(this).data('id');
   
      Swal.fire({
    title: "Are you sure?",
    text: "This Testimonial will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;

    $.ajax({
      url: `/testimonialsdelete/${id}`,
      type: 'DELETE',
      success: res => {
        if (res.success) {
          toastr.success(res.message || "Deleted successfully");
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Delete failed");
        }
      },
      error: () => toastr.error("Server error")
    });
      });
  });

  // ==========================
  // AI REVIEW GENERATE
  // ==========================
  $('#generateAIReview').click(() => {
    const name = $('#name').val().trim();

    if (!name) {
      toastr.warning("Please enter Name first");
      return;
    }

      const loadingToast = toastr.info(
        "AI is writing description...",
        "Please wait",
        { timeOut: 0, extendedTimeOut: 0 }
    );

    $.ajax({
      url: '/generateDescription',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name , prompt : `
Write a professional and positive customer review in 25 to 30 words.
The review is for a website named "Weblify".
`}),
      success: res => {
        toastr.clear(loadingToast);
        if (!res.success) {
          toastr.error(res.message || "AI failed");
          return;
        }

        const fullDesc = res.description || "";
        const shortDesc = fullDesc.split(' ').slice(0, 35).join(' ') + '...';
        $('#reviewText').val(shortDesc);

        toastr.success("Review generated by AI");
      },
      error: () =>{
      toastr.clear(loadingToast);
      toastr.error("AI generation failed")
      }
    });
  });

});
