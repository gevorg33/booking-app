#!/usr/bin/env python3
"""Regenerate guide-flow-customer-public-i18n.hy.json (ai-guide-1.5.5).

Canonical HY copy is maintained in guide-flow-customer-public-i18n.hy.json.
After editing that file, run:
  python3 scripts/sync-customer-public-guide-i18n.py
"""
import json
from pathlib import Path

# Canonical HY copy — aligned with consumer-copy-catalog.ts tone.
HY = {
    "common": {
        "step1": "Քայլ 1",
        "step2": "Քայլ 2",
        "step3": "Քայլ 3",
        "step4": "Քայլ 4",
        "step5": "Քայլ 5",
    },
    "customer": {
        "gettingStarted": {
            "title": "Սկսել",
            "summary": "Բարի լույս → ընտրեք սրահ → ծառայություն → ժամ → հաստատեք առաջին ամրագրումը։",
            "step1": "Բացեք հավելվածը կամ հետևեք ձեր սրահի ամրագրման հղմանը։",
            "step2": "Գտեք սրահը կամ ընտրեք ձեր վերջին այցելություններից։",
            "step3": "Բացեք «Ծառայություններ» և ընտրեք անհրաժեշտ ծառայությունը։",
            "step4": "Ընտրեք ազատ ժամ — մոտակա slot-ը կարող է արդեն ընտրված լինել։",
            "step5": "Հաստատման քայլում ստուգեք մանրամասները և պահպանեք ամրագրումը։",
        },
        "activation": {
            "welcome": {
                "title": "Բարի լույս",
                "summary": "Սկսեք այստեղից, նախքան սրահ ընտրելը։",
                "step1": "Բացեք հավելվածը կամ սեղմեք ամրագրման հղմանը։",
                "step2": "Դիտեք վերջին սրահները կամ որոնեք անվամբ։",
                "step3": "Սեղմեք սրահի վրա՝ դրա գլխավոր էկրանը բացելու և շարունակելու համար։",
            },
            "salon": {
                "title": "Ընտրեք սրահ",
                "summary": "Ընտրեք այն բիզնեսը, որտեղ ցանկանում եք ամրագրել։",
                "step1": "Համոզվեք, որ գտնվում եք սրահի գլխավոր էկran-ում։",
                "step2": "Դիտեք առաջարկները և առաջիկա ամրագրումները, եթե ցուցադրվում են։",
                "step3": "Բացեք «Ծառայություններ»՝ հաջորդ քայլին անցնելու համար։",
            },
            "service": {
                "title": "Ընտրեք ծառայություն",
                "summary": "Ընտրեք ամրագրման տեսակը նախքան ժամ ընտրելը։",
                "step1": "Դիտեք կategorial-ner-ը և համematiրteq տevoxutyun-ը ու գինը։",
                "step2": "Սեղմեք ծառayutyun-i vra՝ amragrmanneri oratsuyts-ը bacelu hamar։",
                "step3": "Շarunakreq jhami qaylin, erb patrast eq։",
            },
            "slot": {
                "title": "Ընտրեք ժամ",
                "summary": "Ընտրեք ազat slot oratsuytsic։",
                "step1": "Ստուգեք arajarkvac motaka slot-ը, ete naxnakan yntrvats e։",
                "step2": "Փoxarqeq or-ը kam jham-ը, ete urish slot eq uzum։",
                "step3": "Ընtreq slot՝ hstatarum qaylin ancnelu hamar։",
            },
            "confirm": {
                "title": "Հաստատեք ամրագրումը",
                "summary": "Սtugeq amen inch naxkanc uxarkel-ը։",
                "step1": "Սtugeq tsarayutyun-ը, masnaget-ը, amsativ-ը ev jham-ը։",
                "step2": "Avelacreq nshumner kam paketner, ete arajarkvum en։",
                "step3": "Hstaturum ev pahpaneq hstaturum-ը։",
            },
        },
        "tabs": {
            "title": "Գլխavar, Ծառayutyunner և Հashiv",
            "summary": "Navigatsia havelvatsi вклadokner-ov։",
            "step1": "Գlխavar ekranum cuyc em trvum arajik amragrmanner ev arajarkner։",
            "step2": "«Tsarayutyunner» вклadokum en kategorianer ev paketner։",
            "step3": "«Heshiv» вклadokum en profil, push-ner ev «Ognut'yun ev guid»։",
        },
        "bookingFlow": {
            "title": "Ամragreլ ayc",
            "summary": "Masnaget → tsarayutyun → slot → vcharum → hstaturum։",
            "step1": "Yntreq masnaget kam «Vorqan eli hasaneli»։",
            "step2": "Yntreq tsarayutyun-ը ev avelacvumner-ը։",
            "step3": "Yntreq azat slot oratsuytsic։",
            "step4": "Avarteq vcharum-ը ev pahpaneq hstaturum-ը։",
        },
        "packages": {
            "title": "Paketner ev naxarapakner",
            "summary": "Gneq paketner, abonementner kam naxarapakner, erb arajarkvum en։",
            "step1": "Bacreq «Paketner» Tsarayutyunneric kam Hesabic։",
            "step2": "Stugeq inch e nerkayacvum ev vaghjnutyunner-ը։",
            "step3": "Gneq ev checkout-um kirararkeq hajord amragrmanin։",
        },
        "account": {
            "title": "Heshiv ev amragrmanner",
            "summary": "Mutq gorzeq, tarkceq profil-ը ev karavarkeq arajik ayceluer-ը։",
            "step1": "Mutq gorzeq email-ov kam SMS kodov։",
            "step2": "Tarkceq profil-i tvyalner-ը ev push kargavorman-ner-ը։",
            "step3": "Tarmatsreq kam chancel areq arajik amragrmanneric, erb tuyllatrvum e։",
        },
        "assistant": {
            "title": "AI ognakan hachaxnerin",
            "summary": "Harcreq amragrmanneri masin orinak harcerov։",
            "step1": "Sxmek AI chip-ը amragrmanneri ekranerum։",
            "step2": "Pordzarkeq arajarkvac harcer kam greq dzer harc-ը։",
            "step3": "Tveq krknak vardzakutyun, ete patasxan-ը sxal er։",
        },
    },
    "public": {
        "bookingFunnel": {
            "title": "Amragrel onlayn",
            "summary": "Anonim ayceluer-ner-ը karox en amragrel aranc heshiv-i, erb miacvats e։",
            "step1": "Yntreq tsarayutyun public booking ekranic-ic։",
            "step2": "Yntreq masnaget ev azat slot։",
            "step3": "Lratreq kap tvyalner-ը ev hstaturum։",
        },
        "professionals": {
            "title": "Yntreq masnaget",
            "summary": "Yntreq, tiv o vum eq uzum tesnel, naxkanc tsarayutyun kam jham։",
            "step1": "Diteq «Masnagetner» ej-ը ev hamemativqteq bio ev reytingner-ը։",
            "step2": "Sxmek masnaget-i vra՝ nra tsarayutyunner-ը ev azat jhamner-ը tesnelu hamar։",
            "step3": "Sharunakreq Tsarayutyunner kam sxmek slot՝ checkout-in motecnelu hamar։",
        },
        "services": {
            "title": "Yntreq tsarayutyun",
            "summary": "Yntreq ayd amenayn tesak, voric uzum eq amragrel։",
            "step1": "Bacreq Tsarayutyunner masnaget yntreluc heto (kam menu-ic)։",
            "step2": "Hamemativqteq tevoxutyun, gin ev nkaragrutyun։",
            "step3": "Sxmek tsarayutyan vra՝ azat jhamner bacelu ev checkout sharunakelu hamar։",
        },
        "checkout": {
            "title": "Onlayn vcharum",
            "summary": "Vjarreq depozit kam amboxj gumar online checkout-um։",
            "step1": "Stugeq gin, tevoxutyun ev chancel policy։",
            "step2": "Lratreq vcharayin tvyalner, ete naxkakan vcharum e pahpanvum։",
            "step3": "Pahpaneq email/SMS hstaturum-ը։",
        },
        "availability": {
            "title": "Stugeq azatutyun",
            "summary": "Tesek azat slot-ner naxkanc checkout-in։",
            "step1": "Yntreq tsarayutyun՝ oratsuyts-ը bacelu hamar։",
            "step2": "Ogtagortseq motaka azat kam yntreq konkret or։",
            "step3": "Slot-ner-ը tarmacnum en, erb biznesi oratsuyts-ը poxvum e։",
        },
    },
    "overlays": {
        "clinic": {
            "consumer": {
                "title": "Lab ardyunqner ev hraytararutyunner",
                "summary": "Clinic hachaxner-ը karox en tesnel lab ardyunqner ev patasxanatvutyun։",
                "step1": "Bacreq «Ardyunqner» kam «Lab» вклadokic, erb miacvats e։",
                "step2": "Kardal patasxanatvutyun-ner aydc-ic naxkanc aydc։",
                "step3": "Neragrel kam share ardyunqner-ը, erb clinic-ը tesnum e։",
            },
        },
        "tour": {
            "checkout": {
                "title": "Tour checkout",
                "summary": "Group tour-ner-um kareli e depozit ev koxmaki chaps։",
                "step1": "Hstaturum koxmaki chaps-ը ev tour amsativ-ը։",
                "step2": "Vjarreq checkout-um tesvac depozit-ը։",
                "step3": "Pahpaneq hstaturum-ը meeting point-ov։",
            },
            "packages": {
                "title": "Tour paketner",
                "summary": "Bundle araqel mi qani tour amsativ kam avelacumner։",
                "step1": "Diteq tour paketner Tsarayutyunneric։",
                "step2": "Stugeq koxmaki sahman-ner ev chgarelu amsativner։",
            },
        },
    },
}

if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "src/modules/ai/guide/guide-flow-customer-public-i18n.hy.json"
    out.write_text(json.dumps(HY, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(out)
