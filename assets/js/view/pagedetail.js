document.addEventListener("DOMContentLoaded", function () {

    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "3000"
    };
    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
    window.pageNames.forEach((name, index) => {
        const pageId = index + 1;
         const editorId = `#editor-${pageId}`;

         $(editorId).summernote({
            placeholder: `Write content for ${name}...`,
            tabsize: 2,
            height: 400,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'video']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ]
        });

      
        const savedData = window.existingContent.find(p => p.pageId === pageId);
            if (savedData && savedData.content) {
     
            const cleanHtml = decodeHtml(savedData.content);
            $(editorId).summernote('code', cleanHtml);
        }
      
        // Form submit sync
        document.getElementById(`pageForm-${pageId}`).addEventListener("submit", async function (e) {
            e.preventDefault();

             const contentHtml = $(editorId).summernote('code');
               if ($(editorId).summernote('isEmpty')) {
                toastr.warning("Content cannot be empty!", "Warning");
                return;
            }
            try {
                const response = await fetch("/addpagedetails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        pageId: pageId,
                        content: contentHtml 
                    })
                });

                const data = await response.json();

                if (data.success) {
                    toastr.success("Page Saved Successfully!", "success");
                } else {
                    toastr.error(data.message || "Something went wrong", "error");
                }

            } catch (error) {
                console.error("Save Error:", error);
                toastr.error("Server error", "error");
            }
        });
    });
});