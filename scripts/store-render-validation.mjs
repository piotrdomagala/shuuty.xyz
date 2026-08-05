export function validateCaptureRect(asset) {
  const rect = asset.captureRect;
  const values = rect ? [rect.x, rect.y, rect.width, rect.height] : [];
  if (
    values.length !== 4 ||
    values.some((value) => !Number.isInteger(value)) ||
    rect.x < 0 ||
    rect.y < 0 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.x + rect.width > asset.width ||
    rect.y + rect.height > asset.height
  ) {
    throw new Error(
      `Asset ${asset.id} captureRect must be an integer rectangle inside its canvas.`,
    );
  }
  return (rect.width * rect.height) / (asset.width * asset.height);
}

export function validatePhoneObjectPosition(asset) {
  const value = asset.objectPosition;
  const match =
    typeof value === "string"
      ? /^(\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/u.exec(value)
      : null;
  const coordinates = match ? [Number(match[1]), Number(match[2])] : [];
  if (
    coordinates.length !== 2 ||
    coordinates.some(
      (coordinate) =>
        !Number.isFinite(coordinate) || coordinate < 0 || coordinate > 100,
    )
  ) {
    throw new Error(
      `Phone asset ${asset.id} objectPosition must be two percentages between 0% and 100%.`,
    );
  }
}

export function validateMinimumCaptureCoverage(asset) {
  const minimum = asset.minimumCaptureCoverage;
  if (!Number.isFinite(minimum) || minimum <= 0 || minimum > 1) {
    throw new Error(
      `Phone asset ${asset.id} minimumCaptureCoverage must be a finite number greater than 0 and at most 1.`,
    );
  }
  return minimum;
}

export function validatePhoneCropContract(asset) {
  validatePhoneObjectPosition(asset);
  const coverage = validateCaptureRect(asset);
  const minimum = validateMinimumCaptureCoverage(asset);
  if (coverage < minimum) {
    throw new Error(
      `Asset ${asset.id} capture coverage ${(coverage * 100).toFixed(2)}% is below ${(minimum * 100).toFixed(2)}%.`,
    );
  }
  return coverage;
}
