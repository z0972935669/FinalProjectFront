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

  // 首頁 - swiper
  const swiper1 = new Swiper('#swiper1', {
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 800,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });

    const swiper2 = new Swiper('#swiper2', {
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      slidesPerView: 4,      // 一次顯示 4 筆
      spaceBetween: 20,      // 每筆間距（px）
      speed: 1000,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      }
    });

    const swiper = new Swiper('#swiper3', {
      loop: true,
      slidesPerView: 2,         // 每次顯示 2 筆
      spaceBetween: 20,         // 筆與筆間距（px）
      speed: 1000,              // 輪播速度（ms）
      autoplay: {
        delay: 2500,            // 自動輪播間隔
        disableOnInteraction: false
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  });
