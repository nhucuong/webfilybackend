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

    // ==========================
    // QUILL INIT
    // ==========================
    var quill = new Quill('#quillEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    const modal = new bootstrap.Modal(document.getElementById("blogModal"));

    // ==========================
    // RESET DATATABLE
    // ==========================
    if ($.fn.DataTable.isDataTable("#zero_config")) {
        $("#zero_config").DataTable().clear().destroy();
    }

    const table = $("#zero_config").DataTable({
        responsive: true,
        autoWidth: false,
        ajax: { url: "/blogjson", dataSrc: "data" },
        columns: [
            {
                data: "image",
                render: (img) =>
                    img
                        ? `<img src="${img}" width="70" class="rounded">`
                        : `<span class="text-muted">No Image</span>`
            },
            { data: "title",
                render: (t) =>
                    t.length > 30
                        ? `${t.slice(0, 30)}...`
                        : t
             },
            {
                data: "description",
                render: (d) =>
                    d.length > 80
                        ? `${d.slice(0, 80)}...`
                        : d
            },
            {
                data: null,
                render: (row) => `
                <div class="dropdown dropstart">
                    <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow">
                        <li>
                            <button class="dropdown-item editBlog" data-id="${row._id}">
                                <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item deleteBlog" data-id="${row._id}">
                                <i class="fa-solid fa-trash me-2 text-danger"></i>Delete
                            </button>
                        </li>
                    </ul>
                </div>`
            }
        ]
    });

    // ==========================
    // IMAGE BOX CLICK
    // ==========================
    $("#imageBox").click(() => {
        $("#image").trigger("click");
    });

    // IMAGE PREVIEW
    $("#image").change(function () {
        if (!this.files[0]) return;
        const reader = new FileReader();
        reader.onload = (e) => $("#previewImage").attr("src", e.target.result).show();
        reader.readAsDataURL(this.files[0]);
    });

    // ==========================
    // ADD BLOG
    // ==========================
    $("#addBlogBtn").click(() => {
        $("#blogForm")[0].reset();
        $("#blogId").val("");
        $("#previewImage").hide();
        $("#image").val("");
        quill.root.innerHTML = "";

        $("#blogModalLabel").text("Add Blog");
        modal.show();
    });

    // ==========================
    // SAVE BLOG
    // ==========================
    $("#saveBlogBtn").click(() => {

 

    const form = $("#blogForm")[0];

           if (!form.checkValidity()) {  
        form.reportValidity();    
        return;
    }

   $("#description").val(quill.root.innerHTML.trim()); 


    const plainText = quill.getText().trim(); 
    if (!plainText) {
        toastr.error("Please enter Description"); 
        return;
    }
    const $submitBtn = $("#saveBlogBtn");
        const originalBtnContent = $submitBtn.html();
        $submitBtn.prop("disabled", true);
        $submitBtn.html(`
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        `);


        $("#description").val(quill.root.innerHTML);

        const formData = new FormData();
        formData.append("id", $("#blogId").val());
        formData.append("title", $("#title").val());
        formData.append("shortDescription", $("#shortDescription").val());
        formData.append("description", $("#description").val());
        formData.append("author", $("#author").val());
        formData.append("category", $("#category").val());
        if ($("#image")[0].files[0]) {
            formData.append("image", $("#image")[0].files[0]);
        }

        $.ajax({
            url: "/blogsave",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            success: (res) => {
                if (res.success) {
                    toastr.success(res.message || "Blog saved successfully");
                    modal.hide();
                    table.ajax.reload(null, false);
                } else {
                    toastr.error(res.message || "Save failed");
                }
            },
            error: (xhr) => {
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
    // EDIT BLOG
    // ==========================
    $("#zero_config").on("click", ".editBlog", function () {
        const data = table.row($(this).closest("tr")).data();

        $("#blogId").val(data._id);
        $("#title").val(data.title);
        $("#shortDescription").val(data.shortDescription);
        quill.root.innerHTML = data.description;

        $("#image").val("");
        $("#previewImage").attr("src", "").hide();

        if (data.image) {
            $("#previewImage").attr("src", data.image).show();
        }

        $("#author").val(data.author);
        $("#category").val(data.category);
        $("#blogModalLabel").text("Edit Blog");
        modal.show();
    });

    // ==========================
    // AI GENERATE DESCRIPTION
    // ==========================
    $("#generateAI").click(function () {

        const name = $("#title").val().trim();

        if (!name) {
            toastr.warning("Please enter Title first");
            return;
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
            data: JSON.stringify({ name }),
            success: (res) => {
 
                 toastr.clear(loadingToast);
                if (!res.success) {
                    toastr.error(res.message || "AI failed");
                    return;
                }

                const fullDesc = res.description || "";
                const shortDesc = fullDesc.split(" ").slice(0, 35).join(" ") + "...";

                $("#shortDescription").val(shortDesc);
                quill.root.innerHTML = fullDesc;

                toastr.success("Description generated by AI");
            },
            error: () =>{
                 toastr.clear(loadingToast);
                toastr.error("AI generation failed")
            } 
        });
    });

    // ==========================
    // DELETE BLOG (NO CONFIRM)
    // ==========================
    $("#zero_config").on("click", ".deleteBlog", function () {
        const id = $(this).data("id");

        Swal.fire({
    title: "Are you sure?",
    text: "This blog will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;

        $.ajax({
            url: `/blogdelete/${id}`,
            type: "DELETE",
            success: (res) => {
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

});
