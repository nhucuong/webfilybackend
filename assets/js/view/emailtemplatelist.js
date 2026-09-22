document.addEventListener('DOMContentLoaded', () => {

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

   $(document).ready(function() {
      
      // Initialize Summernote on all textareas with class 'summernoteEditor'
      $('.summernoteEditor').each(function() {
          $(this).summernote({
              placeholder: 'Design your email content here...',
              tabsize: 2,
              height: 400, // Editor Height
              toolbar: [
                  ['style', ['style']],
                  ['font', ['bold', 'underline', 'clear', 'fontsize', 'fontname']],
                  ['color', ['color']],
                  ['para', ['ul', 'ol', 'paragraph', 'height']],
                  ['table', ['table']],
                  ['insert', ['link', 'picture', 'video', 'hr']],
                  ['view', ['fullscreen', 'codeview', 'help']]
              ],
              // Optional: Fix font display issues
              fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New'],
              callbacks: {
                  onInit: function() {
                      // Optional: Default content check or tweaks
                  }
              }
          });
      });

  });

  // Copy shortcode
  // Copy shortcode safely
  document.querySelectorAll('.copy-var').forEach(el => {
    el.addEventListener('click', async () => {
      const textToCopy = el.innerText.trim();
      if (!textToCopy) return;

      // Check if clipboard API available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          toastr.success(`Copied: ${textToCopy}`);
        } catch (err) {
          console.error("Clipboard write failed:", err);
          toastr.error("Failed to copy to clipboard");
        }
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          toastr.success(`Copied: ${textToCopy}`);
        } catch (err) {
          console.error("Fallback copy failed:", err);
          toastr.error("Failed to copy to clipboard");
        }
        document.body.removeChild(textarea);
      }
    });
  });


  // Form submission
  document.querySelectorAll('.emailTemplateForm').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const type = form.querySelector('input[name="type"]').value;
       const $editor = $(form).find('.summernoteEditor');
      const htmlContent = $editor.summernote('code');
     if ($editor.summernote('isEmpty')) {
        toastr.error("Message content cannot be empty");
        return;
      }

      const payload = {
        type,
        subject: form.querySelector('.subject').value,
        from_name: form.querySelector('.from_name').value,
        from_email: form.querySelector('.from_email').value,
        htmlContent
      };

      try {
        const res = await fetch(`/updateemailtemplate/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          toastr.success("Template updated successfully!");
        } else {
          toastr.error(`Update failed: ${data.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        toastr.error('Error updating template');
      }
    });
  });
});
