/**
 * Scoped CSS for Termly-generated legal pages.
 * All selectors are prefixed with .termly-content so they
 * don't leak to the rest of the app.
 */
export const termlyStyles = `
.termly-content [data-custom-class='body'],
.termly-content [data-custom-class='body'] * {
  background: transparent !important;
}
.termly-content [data-custom-class='title'],
.termly-content [data-custom-class='title'] * {
  font-family: Arial !important;
  font-size: 26px !important;
  color: #000000 !important;
}
.termly-content [data-custom-class='subtitle'],
.termly-content [data-custom-class='subtitle'] * {
  font-family: Arial !important;
  color: #595959 !important;
  font-size: 14px !important;
}
.termly-content [data-custom-class='heading_1'],
.termly-content [data-custom-class='heading_1'] * {
  font-family: Arial !important;
  font-size: 19px !important;
  color: #000000 !important;
}
.termly-content [data-custom-class='heading_2'],
.termly-content [data-custom-class='heading_2'] * {
  font-family: Arial !important;
  font-size: 17px !important;
  color: #000000 !important;
}
.termly-content [data-custom-class='body_text'],
.termly-content [data-custom-class='body_text'] * {
  color: #595959 !important;
  font-size: 14px !important;
  font-family: Arial !important;
}
.termly-content [data-custom-class='link'],
.termly-content [data-custom-class='link'] * {
  color: #3030F1 !important;
  font-size: 14px !important;
  font-family: Arial !important;
  word-break: break-word !important;
}
.termly-content ul { list-style-type: square; }
.termly-content ul > li > ul { list-style-type: circle; }
.termly-content ul > li > ul > li > ul { list-style-type: square; }
.termly-content ol li { font-family: Arial; }
.termly-content h1,
.termly-content h2,
.termly-content h3 {
  display: inline;
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
  padding: 0;
}
.termly-content table {
  border-collapse: collapse;
  width: 100%;
}
`;
