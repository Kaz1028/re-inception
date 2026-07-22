import os
import re

FILE_PATH = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception\contact\index.html"

def replace_form():
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the start of the form
    # It might be '<form action="/contact/confirm/" method="post">' or similar depending on the previous steps
    
    start_match = re.search(r'<form[^>]*>', content)
    end_str = '</form>'
    
    if start_match:
        start_idx = start_match.start()
        end_idx = content.find(end_str, start_idx) + len(end_str)
        
        new_form_html = """<form method="POST" name="contact" data-netlify="true" action="/contact_success.html">
          <table class="form-table">
            <tr>
              <th class="form-must"><span>お問い合せ内容</span></th>
              <td>
                <ul class="subject-input" style="list-style:none; padding-left:0;">
                  <li><input type="checkbox" name="subject[]" value="お店に直接訪問したい" id="subject1"><label for="subject1"> お店に直接訪問したい</label></li>
                  <li><input type="checkbox" name="subject[]" value="希望条件に合う物件を紹介してほしい" id="subject2"><label for="subject2"> 希望条件に合う物件を紹介してほしい</label></li>
                  <li><input type="checkbox" name="subject[]" value="入居・購入に関して相談したい" id="subject3"><label for="subject3"> 入居・購入に関して相談したい</label></li>
                  <li><input type="checkbox" name="subject[]" value="管理・物件募集について相談したい" id="subject4"><label for="subject4"> 管理・物件募集について相談したい</label></li>
                  <li><input type="checkbox" name="subject[]" value="その他" id="subject5"><label for="subject5"> その他</label></li>
                </ul>
                <p class="tx-note">備考<br><textarea class="form-textarea" name="subject_memo" rows="4" style="width:100%;"></textarea></p>
              </td>
            </tr>
            <tr>
              <th class="form-must"><span>お名前</span></th>
              <td><input type="text" name="person_name" class="input-tx1" required style="width:100%; padding:8px;"></td>
            </tr>
            <tr>
              <th class="form-must"><span>連絡先</span></th>
              <td>
                <p class="element-tx tx-annotation">※メールは必ずご入力ください。</p>
                <dl class="form-address">
                  <dt>メール</dt>
                  <dd><input type="email" name="person_mail" class="input-tx1" required style="width:100%; padding:8px;"></dd>
                  <dt style="margin-top:10px;">電話番号</dt>
                  <dd><input type="tel" name="person_tel" class="input-tx1" style="width:100%; padding:8px;" placeholder="例: 090-1234-5678"></dd>
                  <dt style="margin-top:10px;">その他の連絡方法</dt>
                  <dd><input type="text" name="person_other_connection" class="input-tx1" style="width:100%; padding:8px;"></dd>
                </dl>
              </td>
            </tr>
            <tr>
              <th><span>希望連絡時間帯</span></th>
              <td><input type="text" name="person_time_of_connection" class="input-tx1" style="width:100%; padding:8px;"></td>
            </tr>
            <tr>
              <th><span>住所</span></th>
              <td><input type="text" name="person_address" class="input-tx1" style="width:100%; padding:8px;"></td>
            </tr>
          </table>
          
          <p class="element-tx tx-annotation" style="margin-top:20px;">
             ※営利目的・商用利用は固くお断りいたします。
          </p>

          <p class="element-tx" style="margin-top:30px; text-align:center;">
              お問い合わせを行う前に、プライバシーポリシーを必ずお読みください。<br>
              同意いただいた場合は「上記にご同意の上 送信する」のボタンをクリックしてください。
          </p>

          <p class="tac" style="margin-top:20px; text-align:center;">
            <button type="submit" class="btn-lv1" style="padding: 15px 60px; font-size: 18px; font-weight:bold; cursor: pointer; color: white; background-color:#404040; border:none; border-radius:5px;">
              上記にご同意の上 送信する
            </button>
          </p>
        </form>"""
        
        content = content[:start_idx] + new_form_html + content[end_idx:]
        
        with open(FILE_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        print("Form replaced successfully.")
    else:
        print("Form boundaries not found.")

if __name__ == "__main__":
    replace_form()
