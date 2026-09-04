window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Do not send arbitrary query strings as page_location. Preserve only explicit,
// sanitised campaign fields as GA campaign parameters.
var params = new URLSearchParams(window.location.search);
function campaignValue(name) {
  return String(params.get(name) || '').replace(/[^a-zA-Z0-9._~ -]/g, '').trim().slice(0, 100);
}
var config = {
  page_title: 'CV',
  page_location: window.location.origin + window.location.pathname,
};
var source = campaignValue('utm_source');
var medium = campaignValue('utm_medium');
var campaign = campaignValue('utm_campaign');
var content = campaignValue('utm_content');
var term = campaignValue('utm_term');
if (source) config.campaign_source = source;
if (medium) config.campaign_medium = medium;
if (campaign) config.campaign_name = campaign;
if (content) config.campaign_content = content;
if (term) config.campaign_term = term;
gtag('config', 'G-ET0FJJS7C7', config);
