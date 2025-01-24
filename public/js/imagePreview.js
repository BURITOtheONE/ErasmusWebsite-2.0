// Image Preview Function for Projects
document.getElementById('projectImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('projectImagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Project Image" class="img-fluid" style="max-width: 100px; max-height: 100px;">`;
        };
        reader.readAsDataURL(file);
    }
});

// Image Preview Function for News
document.getElementById('newsImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('newsImagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="News Image" class="img-fluid" style="max-width: 100px; max-height: 100px;">`;
        };
        reader.readAsDataURL(file);
    }
});
