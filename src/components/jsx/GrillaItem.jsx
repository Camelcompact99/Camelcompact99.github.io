import React, { useRef, useEffect } from 'react';

const GrillaItem = React.forwardRef(({
    slug,
    title,
    year,
    seenIn,
    material,
    videoopcional,
    externalLink,
    image, // This is the regular React Node (Astro Image component)
    isMobile,
    readyToLoad
}, ref) => {
    const href = externalLink || `/${slug.split("/")[0]}/works/${slug.split("/")[1]}`;
    const videoRef = useRef(null);

    // Sync video attributes just in case
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.setAttribute("webkit-playsinline", "true");
        }
    }, [isMobile, readyToLoad]);

    return (
        <section className="fullscreen-section" ref={ref}>
            <div className="media">
                {/* If video exists, not mobile, and ready to load, show video. Else show the passed Image */}
                {videoopcional && !isMobile && readyToLoad ? (
                    <video
                        src={videoopcional}
                        muted
                        loop
                        playsInline
                        webkit-playsinline="true"
                        x5-playsinline="true"
                        preload="none"
                        // We use the passed image as poster if needed, but we can't extract src easily from ReactNode.
                        // But since readyToLoad is true, we assume smooth transition.
                        ref={videoRef}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    // Render the Astro <Image /> passed as children/prop
                    // We wrap it to ensure styling
                    <div className="img-container">
                        {image}
                    </div>
                )}
            </div>
            <a className="info" href={href} target={externalLink ? '_blank' : '_self'} rel={externalLink ? 'noopener noreferrer' : ''}>
                <h3>{title}</h3>
                <div className="infoText">
                    <p className="mobile">{seenIn}</p>
                    <p className="mobile">{material}</p>
                    <p>{year}</p>
                </div>
            </a>
            <style jsx>{`
        .img-container {
             width: 100%;
             height: 100%;
        }
        .img-container :global(img) {
             width: 100%;
             height: 100%;
             object-fit: cover;
        }
      `}</style>
        </section>
    );
});

export default GrillaItem;
