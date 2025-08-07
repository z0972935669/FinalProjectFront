document.addEventListener('DOMContentLoaded', function () {
  const goTopBtn = document.getElementById('gotop');

  function toggleGoTopBtn() {
    if (window.scrollY > 300) {
      goTopBtn.style.display = 'block';
        goTopBtn.style.opacity = '1';
    } else {
      goTopBtn.style.opacity = '0';
        goTopBtn.style.display = 'none';
    }
  }

  toggleGoTopBtn();

  window.addEventListener('scroll', toggleGoTopBtn);

  goTopBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
