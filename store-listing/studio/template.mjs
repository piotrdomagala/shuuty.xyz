const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sourceUrl = (sourcePath, assetDataUrls) => {
  const embedded = assetDataUrls?.[sourcePath];
  if (embedded) {
    return embedded;
  }
  return `/${sourcePath.replace(/^store-listing\//, "").replaceAll("\\", "/")}`;
};

const rasterArtwork = (artwork, assetDataUrls) => {
  if (!artwork) {
    return "";
  }

  const { x, y, width, height } = artwork.rect;
  return `<img
    class="relay-artwork"
    src="${sourceUrl(artwork.path, assetDataUrls)}"
    alt=""
    aria-hidden="true"
    decoding="sync"
    fetchpriority="high"
    style="--artwork-x: ${x}px; --artwork-y: ${y}px; --artwork-width: ${width}px; --artwork-height: ${height}px"
  >`;
};

const featureAltText = (asset, campaign) => {
  const localizedAltText = campaign.storeAssets?.[asset.storeAssetId]?.altText;
  if (!localizedAltText) {
    return "";
  }
  if (asset.locale === "localization-independent") {
    return localizedAltText["en-US"] ?? Object.values(localizedAltText)[0] ?? "";
  }
  return localizedAltText[asset.locale] ?? "";
};

const readinessScript = `
  (() => {
    const images = Array.from(document.images);
    const imagePromises = images.map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode()
    );

    Promise.all([document.fonts.ready, ...imagePromises])
      .then(() => {
        const fontsReady = [400, 500, 600, 700].every((weight) =>
          document.fonts.check(weight + ' 24px "DM Sans"')
        );
        const imagesReady = images.every((img) => img.complete && img.naturalWidth > 0);
        document.documentElement.dataset.fontsReady = String(fontsReady);
        document.documentElement.dataset.imagesReady = String(imagesReady);
        document.documentElement.dataset.studioReady = String(fontsReady && imagesReady);
      })
      .catch((error) => {
        document.documentElement.dataset.studioReady = "false";
        document.documentElement.dataset.studioError = String(error);
      });
  })();
`;

const baseDocument = ({ asset, tokens, body, studioCss, title, renderMode }) => `<!doctype html>
<html lang="${escapeHtml(asset.locale === "localization-independent" ? "en" : asset.locale)}" data-render-mode="${escapeHtml(renderMode)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=${asset.width}, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      ${studioCss}

      :root {
        --canvas-width: ${asset.width}px;
        --canvas-height: ${asset.height}px;
        --background: ${tokens.background};
        --panel: ${tokens.panel};
        --ink: ${tokens.ink};
        --muted: ${tokens.muted};
        --gold: ${tokens.gold};
        --gold-strong: ${tokens.goldStrong};
        --layout-scale: ${asset.layoutScale ?? 1};
      }
    </style>
  </head>
  <body>
    ${body}
    <div class="font-probes" aria-hidden="true">
      <span>DM Sans 400</span><span>DM Sans 500</span><span>DM Sans 600</span><span>DM Sans 700</span>
    </div>
    <script>${readinessScript}</script>
  </body>
</html>`;

const renderPhone = ({
  asset,
  campaign,
  tokens,
  brandMark,
  assetDataUrls,
  studioCss,
  renderMode,
}) => {
  const screenshot = campaign.screenshots.find((entry) => entry.id === asset.screenshotId);
  if (!screenshot) {
    throw new Error(`Missing screenshot copy for ${asset.screenshotId}`);
  }

  const headline = screenshot.headline?.[asset.locale];
  if (!headline) {
    throw new Error(`Missing ${asset.locale} headline for ${asset.screenshotId}`);
  }
  if (!asset.source?.path) {
    throw new Error(`Source capture pending for ${asset.id}; a placeholder cannot be rendered.`);
  }

  const draftStatus = asset.sourceGap ? "Technical draft · source gap" : "Technical draft";
  const status =
    renderMode === "draft"
      ? `<span class="draft-status">${escapeHtml(draftStatus)}</span>`
      : "";
  const captureStyle = [
    `--capture-x: ${asset.captureRect.x}px`,
    `--capture-y: ${asset.captureRect.y}px`,
    `--capture-width: ${asset.captureRect.width}px`,
    `--capture-height: ${asset.captureRect.height}px`,
  ].join("; ");
  const canvasStyle = `--headline-size: ${asset.headlineSize ?? 78}px`;
  const body = `
    <main class="canvas phone-canvas" aria-label="${escapeHtml(headline)}" style="${canvasStyle}">
      <header class="phone-header">
        <div class="phone-meta">
          <span>${String(asset.stage.index).padStart(2, "0")} / ${String(asset.stage.total).padStart(2, "0")}</span>
          ${status}
        </div>
        <h1 class="phone-headline">${escapeHtml(headline)}</h1>
        <img class="brand-mark" src="${sourceUrl(brandMark.path, assetDataUrls)}" alt="" decoding="sync" fetchpriority="high">
      </header>
      ${rasterArtwork(asset.relayArtwork, assetDataUrls)}
      <figure class="phone-capture" style="${captureStyle}">
        <img src="${sourceUrl(asset.source.path, assetDataUrls)}" alt="${escapeHtml(screenshot.altText?.[asset.locale] ?? "")}" style="object-position: ${escapeHtml(asset.objectPosition)}" decoding="sync" fetchpriority="high">
      </figure>
    </main>`;

  const title =
    renderMode === "draft"
      ? `${headline} - Shuuty technical draft`
      : `${headline} - Shuuty`;
  return baseDocument({ asset, tokens, body, studioCss, title, renderMode });
};

const renderFeature = ({
  asset,
  campaign,
  tokens,
  brandMark,
  assetDataUrls,
  studioCss,
  renderMode,
}) => {
  const altText = featureAltText(asset, campaign);
  if (asset.source?.path) {
    const body = `
      <main class="canvas feature-raster-canvas" aria-label="${escapeHtml(altText)}">
        <img class="feature-raster" src="${sourceUrl(asset.source.path, assetDataUrls)}" alt="" decoding="sync" fetchpriority="high">
      </main>`;
    const title =
      renderMode === "draft"
        ? "Golden Relay feature graphic technical draft"
        : "Golden Relay feature graphic";
    return baseDocument({ asset, tokens, body, studioCss, title, renderMode });
  }

  if (asset.composition === "product-proof") {
    const localizedSteps = campaign.storeAssets?.[asset.storeAssetId]?.steps?.[asset.locale];
    if (!Array.isArray(localizedSteps) || localizedSteps.length !== asset.sources.length) {
      throw new Error(`Missing product-proof step copy for ${asset.id}`);
    }

    const proofCards = asset.sources
      .map(
        (source, index) => `
          <figure class="feature-proof-card feature-proof-card-${escapeHtml(source.role)}">
            <figcaption>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <strong>${escapeHtml(localizedSteps[index])}</strong>
            </figcaption>
            <div class="feature-proof-window">
              <img src="${sourceUrl(source.path, assetDataUrls)}" alt="" style="object-position: ${escapeHtml(source.objectPosition)}" decoding="sync" fetchpriority="high">
            </div>
          </figure>`,
      )
      .join("");

    const body = `
      <main class="canvas feature-product-proof" aria-label="${escapeHtml(altText)}">
        ${rasterArtwork(asset.relayArtwork, assetDataUrls)}
        <header class="feature-proof-lockup" aria-label="Shuuty">
          <img src="${sourceUrl(brandMark.path, assetDataUrls)}" alt="" decoding="sync" fetchpriority="high">
          <strong>Shuuty</strong>
        </header>
        <div class="feature-proof-cards">${proofCards}</div>
      </main>`;

    const title =
      renderMode === "draft"
        ? `Shuuty product proof ${asset.locale} technical draft`
        : `Shuuty product proof ${asset.locale}`;
    return baseDocument({ asset, tokens, body, studioCss, title, renderMode });
  }

  const panels = asset.sources
    .map(
      (source) => `
        <figure class="feature-panel">
          <img src="${sourceUrl(source.path, assetDataUrls)}" alt="" style="object-position: ${escapeHtml(source.objectPosition)}" decoding="sync" fetchpriority="high">
        </figure>`,
    )
    .join("");

  const body = `
    <main class="canvas feature-canvas" aria-label="${escapeHtml(altText)}">
      <div class="feature-panels">${panels}</div>
      ${rasterArtwork(asset.relayArtwork, assetDataUrls)}
    </main>`;

  const title =
    renderMode === "draft"
      ? "Golden Relay feature graphic technical draft"
      : "Golden Relay feature graphic";
  return baseDocument({ asset, tokens, body, studioCss, title, renderMode });
};

export function renderAssetDocument(context) {
  const completeContext = { ...context, renderMode: context.renderMode ?? "draft" };
  if (context.asset.kind === "phone") {
    return renderPhone(completeContext);
  }
  if (context.asset.kind === "feature") {
    return renderFeature(completeContext);
  }
  throw new Error(`Unsupported asset kind: ${context.asset.kind}`);
}

export function renderPreviewIndex({ assets, campaignHeadline, renderMode = "draft" }) {
  const cards = assets
    .map((asset) => {
      const sourcePending = asset.kind === "phone" && !asset.source?.path;
      const tag = sourcePending ? "div" : "a";
      const href = sourcePending ? "" : ` href="/render/${encodeURIComponent(asset.id)}"`;
      const sourceStatus = sourcePending ? " · source capture pending" : "";
      return `
        <${tag} class="preview-card${sourcePending ? " preview-card-pending" : ""}"${href}>
          <strong>${escapeHtml(asset.id)}</strong>
          <small>${escapeHtml(asset.status)} · ${asset.width}×${asset.height}${escapeHtml(sourceStatus)}</small>
        </${tag}>`;
    })
    .join("");

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Golden Relay studio</title>
        <link rel="stylesheet" href="/studio/studio.css">
        <style>:root { --canvas-width: 100%; --canvas-height: 100%; }</style>
      </head>
      <body class="preview-index">
        <h1>${escapeHtml(campaignHeadline)}</h1>
        <p>${
          renderMode === "draft"
            ? "Local, manifest-driven Golden Relay technical drafts. Nothing here is publication-ready."
            : "Local final-candidate preview. Publication still requires explicit approval."
        }</p>
        <div class="preview-grid">${cards}</div>
      </body>
    </html>`;
}
