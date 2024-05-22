$(document).ready(function () {
    let contracts = []; // 契約書データ保存のための配列を初期化

    const dropArea = $('#drop-area'); // htmlのファイルをドラッグ＆ドロップする変数を作成
    const fileInput = $('#fileElem'); // htmlのファイル選択ボタンの変数

    // ★ドラッグ＆ドロップイベントの設定
    // ドラッグ＆ドロップしている間、ドラッグ＆ドロップ領域を強調表示
    dropArea.on('dragover', function (e) {
        e.preventDefault(); // デフォルトの動作を解除(prevent=防止する)
        e.stopPropagation(); // イベントの伝播を止める(Propagation=伝播)
        dropArea.addClass('highlight');
    });

    // ドラッグ＆ドロップ領域から離れると、強調解除
    dropArea.on('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.removeClass('highlight');
    });

    // ドラッグ＆ドロップされたとき、ファイルを処理
    dropArea.on('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.removeClass('highlight');
        const files = e.originalEvent.dataTransfer.files; //ドロップされたファイルを取得する 
        handleFiles(files); //取得したファイルを処理する関数を呼ぶ 
    });

    // ファイル選択ボタンでファイル選択したときに、そのファイルを処理する
    fileInput.on('change', function (e) {
        const files = e.target.files; // 選択したファイルを呼びだす
        handleFiles(files);
    });

    // 選択したファイルを処理する関数
    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i]; // 現在処理中のファイルを取得
            const reader = new FileReader(); // ファイルを読み込むためのfilereaderオブジェクトを作成

            // ★ファイルの種類がdocxだったとき
            if (file.name.endsWith('.docx')) {
                reader.onload = function (e) { // ファイルが読み込まれたら
                    mammoth.extractRawText({ arrayBuffer: e.target.result })
                        // "mammoth.js"を使って.docxファイルからテキストを抽出
                        .then(function (result) { // うまく読み込めたら
                            const content = result.value;
                            addContract(file.name, content); // 抽出した文章を契約書として追加
                        })
                        .catch(handleError); // エラーだったときの処理
                };
                reader.readAsArrayBuffer(file);

                // ★ファイルの種類がpdfだったとき
            } else if (file.name.endsWith('.pdf')) {
                reader.onload = function (e) {
                    const loadingTask = pdfjsLib.getDocument({ data: e.target.result });
                    // "pdf.js"を使って.pdfファイルを読み込む
                    loadingTask.promise.then(function (pdf) { // うまく読み込めたら
                        let content = ''; // 各ページのテキストを取得し、"content"に追加する
                        const pagesPromises = [];
                        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            pagesPromises.push(pdf.getPage(pageNum).then(page => {
                                return page.getTextContent().then(textContent => {
                                    textContent.items.forEach(item => {
                                        content += item.str + ' ';
                                    });
                                });
                            }));
                        }
                        Promise.all(pagesPromises).then(() => { // すべてのページを読み込んだあとの処理
                            addContract(file.name, content); // 抽出した文章を契約書として追加
                        });
                    }, handleError); // エラーだったときの処理※catchが省略されている？
                };
                reader.readAsArrayBuffer(file);

                // ★ファイルの種類がそのほかの形式(.txt)だったとき
            } else {
                reader.onload = function (e) {
                    const content = e.target.result; // ファイルが読み込まれたら
                    addContract(file.name, content); // 抽出した文章を契約書として追加
                };
                reader.readAsText(file);
            }
        }
    }

    // 契約書を追加する関数
    function addContract(title, content) {
        const date = new Date().toLocaleDateString(); // 現在の日付を取得
        const contract = { title, content, date }; //  契約書のオブジェクトを作成
        contracts.push(contract); // 契約書のオフジェクトを契約書の配列に追加
        displayContracts(); // 契約書のリストを表示する関数
    }

    // 契約書のリストを表示する関数
    function displayContracts() {
        const contractList = $('#contract-list'); // 契約書を表示する場所を取得
        contractList.empty(); // 契約書リストを空にする
        contracts.forEach((contract, index) => { // 各契約書を順に処理する
            const contractItem = $('<div>').addClass('contract-item'); 
            // 契約書を表示するためのdivを用意する

            const titleInput = $('<input>').attr('type', 'text').val(contract.title);
            // 契約書のタイトルを表示する入力フィールドを作成
            titleInput.on('change', function () {
                contract.title = $(this).val(); //タイトルが変更されたとき、その変更を契約書のオブジェクトに反映 
            });

            const dateElement = $('<span>').text(contract.date); // 契約書の日付を表示

            const createButton = $('<button>').text('重要事項作成');
            createButton.on('click', function () {
                showImportantDetailsPage(contract); // クリックされたときに、契約書詳細ページに遷移する
            });

            contractItem.append(titleInput, dateElement, createButton);
            contractList.append(contractItem);
        });
    }

    // 重要事項の詳細ページを表示させる関数
    function showImportantDetailsPage(contract) { 
        $('#contract-data').val(contract.content); // 契約書の内容をテキストエリアに表示させる
        $('#important-details-data').val(''); // 重要事項の入力エリアを空にする
        $('#important-details-page').removeClass('hidden'); // 重要事項の詳細ページを表示
        $('.container').addClass('hidden'); // 契約書一覧のページを非表示
    }

    // 「都市計画区域/区域区分」ボタンのクリックイベント
    $('#urban-planning-btn').on('click', function () {
        const propertyLocation = $('#property-location').val();
        if (propertyLocation) {
            fetchUrbanPlanningData(propertyLocation);
        } else {
            alert('物件の所在地を入力してください。');
        }
    });

    // 重要事項データを保存する（Excel・PDF）
    $(document).ready(function () {
        $('#save-excel-btn').on('click', function () {
            const formData = new FormData($('#important-details-form')[0]);
            // フォームデータを取得。フォーム内すべての入力フィールドの名前と値のペアを収集している。
            let details = []; // 空の配列（details）を作成
            formData.forEach((value, key) => {
                // フォームデータを繰り返し、各入力フィールドの名前（key）と値（value）を配列（details）に追加
                details.push([key, value]);
            });
            const worksheet = XLSX.utils.aoa_to_sheet(details); // detailsからExcelを作成
            const workbook = XLSX.utils.book_new(); // 新しいエクセルブック（workbook）を作成
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1'); // シート（worksheet）をブック（workbook）に追加
            XLSX.writeFile(workbook, '重要事項データ.xlsx'); // エクセルファイルとして保存
        });

        $('#save-pdf-btn').on('click', function () {
            const formData = new FormData($('#important-details-form')[0]);
            // フォームデータを取得。フォーム内すべての入力フィールドの名前と値のペアを収集している。
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF(); // jsPDF ライブラリを使用して新しいPDFドキュメント（doc）を作成
            let y = 10; // 変数 y を初期化し、PDF内のテキストの垂直位置を指定
            formData.forEach((value, key) => {
                // FormData オブジェクトを繰り返し、各入力フィールドの名前（key）と値（value）をPDFに追加
                doc.text(`${key}: ${value}`, 10, y);
                y += 10;
                // 各項目ごとに y の値を増加させ、次の項目が新しい行に表示されるようにする
            });
            doc.save('重要事項データ.pdf');
        });
    });

    // 戻るボタンがクリックされたとき
    $('#back-btn').on('click', function () {
        $('#important-details-page').addClass('hidden'); // 重要事項の詳細ページを非表示
        $('.container').removeClass('hidden'); // 契約書一覧のページを表示
    });

    // エラーが発生したとき
    function handleError(error) {
        console.error(error);
        alert('ファイルの読み込み中にエラーが発生しました。');
    }
});