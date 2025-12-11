import React, { useState, useEffect, useRef } from "react";
import "./Grilla.css";

export default function GrillaFullscreen({ works }) {
  const [filter, setFilter] = useState("all");
  const wrapperRef = useRef(null);
  const sectionRefs = useRef([]);
  const isScrollingRef = useRef(false);
  const touchStartYRef = useRef(null);
  const filtersRef = useRef(null);
  const activeIndexRef = useRef(-1);
  const [filtersOpacity, setFiltersOpacity] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [readyToLoad, setReadyToLoad] = useState(false);

  useEffect(() => {
    setReadyToLoad(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
    if (wrapperRef.current) {
      const top = wrapperRef.current.offsetTop;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const filtered = works
    .filter((work) => {
      if (filter === "all") return true;
      if (filter === "artistic") return work.data.art === true;
      if (filter === "commissioned") return work.data.art === false;
      return true;
    })
    .sort((a, b) => {
      // Sort by year in descending order (2025 first, older ones last)
      const yearA = a.data.year || 0;
      const yearB = b.data.year || 0;

      if (yearB !== yearA) {
        return yearB - yearA;
      }

      // If same year, sort by priority (lower priority number appears first)
      const priorityA = a.data.priority || 999;
      const priorityB = b.data.priority || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same year and priority, sort alphabetically by title
      return (a.data.title || '').localeCompare(b.data.title || '');
    });

  const setSectionRef = (el, i) => {
    sectionRefs.current[i] = el;
  };

  const getNearestIndex = () => {
    let nearest = 0;
    let min = Infinity;
    sectionRefs.current.forEach((sec, i) => {
      if (!sec) return;
      const sectionRect = sec.getBoundingClientRect();
      const centerDist = Math.abs(sectionRect.top + sectionRect.height / 2 - window.innerHeight / 2);
      if (centerDist < min) {
        min = centerDist;
        nearest = i;
      }
    });
    return nearest;
  };

  const scrollToIndex = (index) => {
    const sec = sectionRefs.current[index];
    if (!sec) return;
    const top = window.scrollY + sec.getBoundingClientRect().top;
    isScrollingRef.current = true;
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 650);
  };

  useEffect(() => {
    const onWheel = (e) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      if (e.clientX < wrapperRect.left || e.clientX > wrapperRect.right || e.clientY < wrapperRect.top || e.clientY > wrapperRect.bottom) return;

      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      const delta = e.deltaY;
      if (Math.abs(delta) < 10) return;

      const dir = delta > 0 ? 1 : -1;
      const idx = getNearestIndex();
      const last = sectionRefs.current.length - 1;

      // 🔥 Ajuste: si estamos fuera del viewport del componente y scroll hacia dentro, snap al primero
      if (idx === 0 && window.scrollY < wrapper.offsetTop && dir === 1) {
        e.preventDefault();
        scrollToIndex(0);
        return;
      }

      if (idx === last && dir === 1) return;
      if (idx === 0 && dir === -1) return;

      e.preventDefault();
      const target = Math.min(last, Math.max(0, idx + dir));
      if (target === idx) return;
      scrollToIndex(target);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [filtered]);

  useEffect(() => {
    let touchMoved = false;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => { touchStartYRef.current = e.touches[0].clientY; touchMoved = false; };
    const onTouchMove = (e) => {
      if (touchStartYRef.current == null) return;
      const currentY = e.touches[0].clientY;
      const diff = touchStartYRef.current - currentY;
      if (Math.abs(diff) < 12) return;

      const wrapperRect = wrapper.getBoundingClientRect();
      const touchY = e.touches[0].clientY;
      if (touchY < wrapperRect.top || touchY > wrapperRect.bottom) return;

      touchMoved = true;
      const dir = diff > 0 ? 1 : -1;
      const idx = getNearestIndex();
      const last = sectionRefs.current.length - 1;
      if (idx === last && dir === 1) return;
      if (idx === 0 && dir === -1) return;

      e.preventDefault();
      if (isScrollingRef.current) return;
      const target = Math.min(last, Math.max(0, idx + dir));
      if (target === idx) return;
      scrollToIndex(target);
    };

    const onTouchEnd = () => { touchStartYRef.current = null; touchMoved = false; };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [filtered]);

  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = window.scrollY + window.innerHeight / 2;
        let nearestIndex = -1;
        let minDistance = Infinity;

        sectionRefs.current.forEach((sec, i) => {
          if (!sec) return;
          const secRect = sec.getBoundingClientRect();
          const secCenter = window.scrollY + secRect.top + secRect.height / 2;
          const dist = center - secCenter;

          if (Math.abs(dist) < minDistance) {
            minDistance = Math.abs(dist);
            nearestIndex = i;
          }

          const media = sec.querySelector('.media');
          if (media) media.style.transform = `translateY(${dist * 0.12}px)`;
        });

        if (nearestIndex !== activeIndexRef.current) {
          if (activeIndexRef.current !== -1 && sectionRefs.current[activeIndexRef.current]) {
            const oldVid = sectionRefs.current[activeIndexRef.current].querySelector('video');
            if (oldVid) oldVid.pause();
          }
          if (nearestIndex !== -1 && sectionRefs.current[nearestIndex]) {
            const newVid = sectionRefs.current[nearestIndex].querySelector('video');
            if (newVid) {
              newVid.currentTime = 0;
              newVid.play().catch(() => { });
            }
          }
          activeIndexRef.current = nearestIndex;
        }

        // Fade out filters when near the end
        if (wrapperRef.current && filtersRef.current) {
          const wrapperRect = wrapperRef.current.getBoundingClientRect();
          const wrapperBottom = wrapperRect.bottom;
          const wrapperTop = wrapperRect.top;
          const viewportHeight = window.innerHeight;
          const distanceFromBottom = wrapperBottom - viewportHeight;

          let newOpacity = 1;

          // Fade out when near the bottom end
          if (distanceFromBottom < 200 && distanceFromBottom > 0) {
            newOpacity = distanceFromBottom / 200;
          } else if (distanceFromBottom <= 0) {
            newOpacity = 0;
          }

          // Fade out when near the top start (e.g. overlapping with Landing)
          if (wrapperTop > 200) {
            newOpacity = 0;
          } else if (wrapperTop > 0) {
            const topOpacity = 1 - (wrapperTop / 200);
            newOpacity = Math.min(newOpacity, topOpacity);
          }

          setFiltersOpacity(newOpacity);
        }

        raf = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [filtered]);

  return (
    <div className="fullscreen-wrapper" id="grid" ref={wrapperRef}>
      {filtered.map(({ slug, data }, index) => {
        const { title, year, seenIn, image, material, videoopcional, externalLink } = data;
        const href = externalLink || `/${slug.split("/")[0]}/works/${slug.split("/")[1]}`;
        return (
          <section key={slug} className="fullscreen-section" ref={(el) => setSectionRef(el, index)}>
            <div className="media">
              {data.imagePlaceholder && (
                <img
                  src={data.imagePlaceholder}
                  className="media-placeholder"
                  alt=""
                  aria-hidden="true"
                />
              )}
              {videoopcional && !isMobile && readyToLoad ? (<video src={videoopcional} muted
                loop
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                preload="none"
                poster={image.src}
                width={image.attributes?.width || 1920}
                height={image.attributes?.height || 1080}
                ref={el => {
                  if (el) {
                    el.setAttribute("playsinline", "true");
                    el.setAttribute("webkit-playsinline", "true");
                  }
                }} />) : (<img src={readyToLoad ? image.src : data.imagePlaceholder} width={image.attributes?.width} height={image.attributes?.height} alt={title} loading="lazy" />)}
            </div>
            <a className="info" href={href} target={externalLink ? '_blank' : '_self'} rel={externalLink ? 'noopener noreferrer' : ''}>
              <h3>{title}</h3>
              <div className="infoText">
                <p className="mobile">{seenIn}</p>
                <p className="mobile">{material}</p>
                <p>{year}</p>
              </div>
            </a>
          </section>
        );
      })}
      <div className="bottom-filters" ref={filtersRef} style={{ opacity: filtersOpacity, transition: 'opacity 0.3s ease', pointerEvents: filtersOpacity === 0 ? 'none' : 'auto' }}>
        {['all', 'commissioned', 'artistic'].map((t) => (<button key={t} onClick={() => handleFilterClick(t)} className={filter === t ? 'active' : ''}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>))}
      </div>
    </div>
  );
}
