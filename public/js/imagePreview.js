document.addEventListener('DOMContentLoaded', function() {
  // Project image preview
  const projectImageInput = document.getElementById('projectImage');
  const projectImagePreview = document.getElementById('projectImagePreview');

  if (projectImageInput && projectImagePreview) {
    projectImageInput.addEventListener('change', function(e) {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          projectImagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;" />
          `;
        }
        reader.readAsDataURL(file);
      } else {
        projectImagePreview.innerHTML = '';
      }
    });
  }

  // Edit project image preview
  const editProjectImageInput = document.getElementById('editProjectImage');
  const editProjectImagePreview = document.getElementById('editProjectImagePreview');

  if (editProjectImageInput && editProjectImagePreview) {
    editProjectImageInput.addEventListener('change', function(e) {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          editProjectImagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;" />
          `;
        }
        reader.readAsDataURL(file);
      } else {
        editProjectImagePreview.innerHTML = '';
      }
    });
  }

  // News image preview
  const newsImageInput = document.getElementById('newsImage');
  const newsImagePreview = document.getElementById('newsImagePreview');

  if (newsImageInput && newsImagePreview) {
    newsImageInput.addEventListener('change', function(e) {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          newsImagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;" />
          `;
        }
        reader.readAsDataURL(file);
      } else {
        newsImagePreview.innerHTML = '';
      }
    });
  }
});