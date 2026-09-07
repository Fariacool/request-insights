/*
 * Behavior derived from OpenPanel's packages/common/server/parser-user-agent.ts
 * at commit 3060ca10213693cf0385be2713c8743d16733a2b.
 * Copyright OpenPanel contributors; AGPL-3.0. See THIRD_PARTY_NOTICES.md.
 */
import { UAParser } from 'ua-parser-js';

import type { BrowserInsights, DeviceInsights, OsInsights } from './types.js';

export interface ParsedUserAgent {
  isServer: boolean;
  device: DeviceInsights;
  browser: BrowserInsights;
  os: OsInsights;
}

const APP_MODEL_REGEX = /Model=([^;)]+)/i;
const APP_MANUFACTURER_REGEX = /Manufacturer=([^;)]+)/i;
const IPHONE_MODEL_REGEX = /(iPhone|iPad)\s*([0-9,]+)/i;
const IOS_MODEL_REGEX = /(iOS)\s*([0-9.]+)/i;
const IPAD_OS_VERSION_REGEX = /iPadOS\s*([0-9_]+)/i;
const SINGLE_NAME_VERSION_REGEX = /^[^/]+\/[\d.]+$/;
const SAMSUNG_MOBILE_REGEX = /SM-[ABDEFGJMNRWZ][0-9]+/i;
const SAMSUNG_TABLET_REGEX = /SM-T[0-9]+/i;
const LG_MOBILE_REGEX = /LG-[A-Z0-9]+/i;
const MOBILE_REGEX_1 =
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
const MOBILE_REGEX_2 =
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i;
const TABLET_REGEX = /tablet|ipad|xoom|sch-i800|kindle|silk|playbook/i;

const KNOWN_PHONE_PATTERNS = [
  /redmi\s*(note|k|[0-9])/i,
  /poco\s*[a-z0-9]/i,
  /mi\s*([0-9]|note|mix|max)/i,
  /galaxy\s*(s|a|m|note)[0-9]/i,
  /galaxy\s*z\s*(fold|flip)/i,
  /huawei\s*(p|mate|nova|y)[0-9]/i,
  /honor\s*[0-9a-z]/i,
  /oppo\s*(a|f|find|reno|k)\s*[a-z0-9]/i,
  /vivo\s*(v|y|x|s|t|iqoo)[0-9]/i,
  /iqoo\s*[0-9a-z]/i,
  /oneplus\s*[0-9]/i,
  /one\s*plus\s*[0-9]/i,
  /pixel\s*[0-9]/i,
  /realme\s*[0-9a-z]/i,
  /moto\s*(g|e|x|z|edge|razr)/i,
  /motorola\s*(edge|razr)/i,
  /nokia\s*[0-9]/i,
  /xperia\s*[0-9a-z]/i,
  /nothing\s*phone/i,
];

const BRAND_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/xiaomi|redmi|poco/i, 'Xiaomi'],
  [/samsung|galaxy/i, 'Samsung'],
  [/huawei/i, 'Huawei'],
  [/honor/i, 'Honor'],
  [/oppo/i, 'OPPO'],
  [/vivo|iqoo/i, 'Vivo'],
  [/oneplus|one\s*plus/i, 'OnePlus'],
  [/google|pixel/i, 'Google'],
  [/realme/i, 'Realme'],
  [/motorola|moto\s/i, 'Motorola'],
  [/nokia/i, 'Nokia'],
  [/sony|xperia/i, 'Sony'],
  [/nothing/i, 'Nothing'],
  [/\bapple\b(?!webkit)|\biphone\b|\bipad\b/i, 'Apple'],
  [/lg[- ]/i, 'LG'],
  [/zte/i, 'ZTE'],
  [/lenovo/i, 'Lenovo'],
  [/asus/i, 'ASUS'],
  [/tcl/i, 'TCL'],
];

const CACHE_MAX = 1_000;
const CACHE_TTL_MS = 5 * 60 * 1_000;
const parseCache = new Map<string, { result: UAParser.IResult; expiresAt: number }>();

function nullable(value?: string): string | null {
  return value || null;
}

function detectBrand(ua: string, model?: string): string | undefined {
  const value = `${ua} ${model ?? ''}`;
  return BRAND_PATTERNS.find(([pattern]) => pattern.test(value))?.[1];
}

function isKnownPhone(value?: string): boolean {
  return Boolean(value && KNOWN_PHONE_PATTERNS.some((pattern) => pattern.test(value)));
}

function getCachedResult(ua: string): UAParser.IResult {
  const now = Date.now();
  const cached = parseCache.get(ua);
  if (cached && cached.expiresAt > now) return cached.result;
  if (cached) parseCache.delete(ua);

  const result = UAParser(ua);
  parseCache.set(ua, { result, expiresAt: now + CACHE_TTL_MS });
  if (parseCache.size > CACHE_MAX) {
    const oldestKey = parseCache.keys().next().value;
    if (oldestKey) parseCache.delete(oldestKey);
  }
  return result;
}

function isServer(result: UAParser.IResult): boolean {
  return (
    SINGLE_NAME_VERSION_REGEX.test(result.ua) ||
    (!result.os.name && !result.browser.name && !result.device.vendor && !result.device.model)
  );
}

export function detectDeviceType(ua: string, model?: string): string {
  if (
    isKnownPhone(model) ||
    isKnownPhone(ua) ||
    SAMSUNG_MOBILE_REGEX.test(ua) ||
    LG_MOBILE_REGEX.test(ua)
  ) {
    return 'mobile';
  }
  if (SAMSUNG_TABLET_REGEX.test(ua) || TABLET_REGEX.test(ua)) return 'tablet';
  if (MOBILE_REGEX_1.test(ua) || MOBILE_REGEX_2.test(ua.slice(0, 4))) return 'mobile';
  if (/android/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function parseUserAgent(userAgent?: string | null): ParsedUserAgent {
  if (!userAgent) {
    return {
      isServer: true,
      device: { type: 'server', brand: null, model: null },
      browser: { name: null, version: null },
      os: { name: null, version: null },
    };
  }

  const result = getCachedResult(userAgent);
  if (isServer(result)) {
    return {
      isServer: true,
      device: { type: 'server', brand: null, model: null },
      browser: { name: null, version: null },
      os: { name: null, version: null },
    };
  }

  const appModel = userAgent.match(APP_MODEL_REGEX)?.[1]?.trim();
  const appManufacturer = userAgent.match(APP_MANUFACTURER_REGEX)?.[1]?.trim();
  const customAppleModel = userAgent.match(IPHONE_MODEL_REGEX)?.[1];
  const customIos = userAgent.match(IOS_MODEL_REGEX);
  const model = result.device.model ?? appModel ?? customAppleModel;
  const brand = result.device.vendor ?? appManufacturer ?? detectBrand(userAgent, model);
  const ipadVersion =
    result.device.model === 'iPad'
      ? userAgent.match(IPAD_OS_VERSION_REGEX)?.[1]?.replaceAll('_', '.')
      : undefined;

  return {
    isServer: false,
    device: {
      type: result.device.type ?? detectDeviceType(userAgent, model),
      brand: nullable(brand),
      model: nullable(model),
    },
    browser: {
      name: nullable(result.browser.name),
      version: nullable(result.browser.version),
    },
    os: {
      name: nullable(result.os.name ?? customIos?.[1]),
      version: nullable(result.os.version ?? ipadVersion ?? customIos?.[2]),
    },
  };
}
