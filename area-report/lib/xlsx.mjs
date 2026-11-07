import {workbook as clientWorkbook} from '../public/xlsx.mjs';
export const workbook=rows=>Buffer.from(clientWorkbook(rows));
