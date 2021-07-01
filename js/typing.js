console.log("読み込み完了");
SpecialKeys.ArrowLeft = () => { $('#cursor').prev().before($('#cursor')) }
SpecialKeys.ArrowRight = () => { $('#cursor').next().after($('#cursor')) }
SpecialKeys.Home = () => { $('.answer span:first-child').before($('#cursor')) }
SpecialKeys.End = () => { $('.answer span:last-child').after($('#cursor')) }

SpecialKeys.Backspace = () => {
    $('#cursor').prev().remove();
    inputCheck();
}
SpecialKeys.Delete = () => {
    $('#cursor').next().remove()
    inputCheck();
}
SpecialKeys[" "] = (k) => {
    // 一文字目または二回連続でスペースを入れられないように
    if ($('.answer').text() != '|' && $('#cursor').prev()[0].innerHTML != ' ') {
        $('#cursor').before(`<span> </span>`);
        inputCheck();
    }
}
SpecialKeys.Enter = () => {
    if (commandCheck()) {// 入力内容がコマンドなら
        $('.answer').html(`<span id='cursor'>|</span></p>`);
        drawConsole();
    } else {
        switch (gameMode) {
            case 'addproblem':// 入力内容がコマンドでなく、問題追加モードの場合
                addProblem();
                break;
            case 'removeproblem':
                removeProblem();
                break;
            case 'typing':// 普通に解答した場合
                correctCheck();
                break;

            default:
                break;
        }
    }
}


// TODO 現在保存されている問題の一覧を表示して削除するremoveproblemコマンドを実装する

let problemURL = 'https://meigen-ijin.com/eigomeigen/';
let problemPageNumber = 2;
let isAddProblem = false;
let gameMode = 'help';


$(() => {
    $('body').on('keydown', (e) => {
        //console.log(e);
        let keyName = e.originalEvent.key;
        // console.log(keyName);

        // スペシャルキーかを評価する
        if (Object.keys(SpecialKeys).includes(keyName)) {
            // 該当する属性の値を変数へ取り出す
            let f = SpecialKeys[keyName];
            if (f != undefined) {
                // それをメソッドとして実行する
                // また、イベントが発生した時のキーの状態を引数として渡す
                f(e.originalEvent);
            }
        } else {
            // 入力文字を表示し、途中判定を行う
            $('#cursor').before(`<span>${keyName}</span>`);
            inputCheck();
        }

        // アニメーションの終了処理
        $('.jello-horizontal').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            $(this).removeClass('jello-horizontal');
        });

        $('.shake-horizontal').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            $(this).removeClass('shake-horizontal');
        });
    })

    // コマンドの判定
    commandCheck = () => {
        // 解答を取得しカーソルの記号を削除
        let answerStatement = $('.answer').text().replace('|', '');

        switch (answerStatement) {
            case 'addproblem':
                isAddProblem = true;
                gameMode = 'addproblem';
                $('.problemStatement').attr('style', 'font-size:50%');
                return true;
            case 'removeproblem':
                gameMode = 'removeproblem';
                $('.problemStatement').attr('style', 'font-size:50%');
                console.log('removeproblem');
                return true;
            case 'clearproblem':
                localStorage.removeItem('problems');
                problems = initProblems;
                return true;
            case 'typing':
                isAddProblem = false;
                gameMode = 'typing';
                $('.problemStatement').attr('style', '');
                console.log('typing');
                return true;
            case 'help':// ヘルプページ
            case '?':
                gameMode = 'help';
                $('.problemStatement').attr('style', 'font-size:50%');
                return true;
            case 'prev':
                if (problemPageNumber > 2) {
                    problemPageNumber--;
                } else {
                    console.log('戻れません');
                }
                return true;
            case 'next':
                problemPageNumber++;
                return true;

            default:
                return false;
        }
    }

    // ランダムな問題文を表示、もしくは問題追加メニューを表示
    drawConsole = () => {
        switch (gameMode) {
            case 'addproblem':// 問題追加
                $('.problemStatement').text('');
                let problemList = getProblem();
                console.log(problemList);

                problemList.forEach((value) => {
                    console.log(value);
                    $('.problemStatement').append(value, '<br>');
                });
                break;
            case 'removeproblem':// 問題削除
                $('.problemStatement').text('');
                problems.forEach((value, index) => {
                    $('.problemStatement').append(index, ': ', value, '<br>');
                });
                break;
            case 'typing':// 通常のタイピング
                // ローカルストレージからの問題リスト読み込み
                let savedProblems = JSON.parse(localStorage.getItem('problems'));
                if (savedProblems) {
                    problems = savedProblems;
                }
                let ProblemIndex = getRandomInt(problems.length);
                // 問題文をランダムに表示する
                $('.problemStatement').text(problems[ProblemIndex]);
                break;
            case 'help':// ヘルプページ
                $('.problemStatement').html(`このサイトはコマンド入力のみで操作します。<br>
                                            help | ?: ヘルプページ<br>
                                            typing: タイピングモードへ移動<br>
                                            addproblem: 問題追加モードへ移動（問題追加モードでは例題が表示され、好きな文章を入力することで問題を追加できます。）<br>
                                            問題追加モード内でnext | prev: 例題のページを移動<br>
                                            removeproblem: 問題削除モードへ移動（問題削除モードでは現在保存されている問題が表示され、各行の先頭の数字を入力することで問題を削除できます）<br>
                                            clearproblem: 編集した問題を初期状態にする
                                            `);
                break;


            default:
                break;
        }
    }

    // 問題の取得
    getProblem = () => {
        console.log('問題取得中...');
        console.log(`${problemURL}${problemPageNumber}`);

        let meigenArray = [];
        let result = $.ajax({
            type: 'GET',
            url: `${problemURL}${problemPageNumber}`,
            async: false
        }).responseText;

        let meigens = $(result).find('p.meigen');

        meigens.each((index, data) => {
            meigenArray.push(data.innerHTML.replace(/<br>/g, ' '));//.split('<br>')[0]);
        });
        return meigenArray;
    }

    // 問題の追加
    addProblem = () => {
        // 解答を取得しカーソルの記号を削除
        let answerStatement = $('.answer').text().replace('|', '');
        problems.push(answerStatement);
        // 問題をローカルストレージに保存
        localStorage.setItem('problems', JSON.stringify(problems));

        $('.answer').html(`<span id='cursor'>|</span></p>`);
        console.log('問題を追加しました', answerStatement);
    }

    // 問題の削除
    removeProblem = () => {
        // 解答を取得しカーソルの記号を削除
        let answerStatement = $('.answer').text().replace('|', '');
        if (answerStatement != '' && 0 <= answerStatement && answerStatement < problems.length) {
            problems.splice(answerStatement, 1);
            // 問題をローカルストレージに保存
            localStorage.setItem('problems', JSON.stringify(problems));
            drawConsole();
        } else {
            console.log('適切な数値を入力してください');
        }
        $('.answer').html(`<span id='cursor'>|</span></p>`);
    }

    // 入力中の正誤判定
    inputCheck = () => {
        // 解答を取得しカーソルの記号を削除
        let answerStatement = $('.answer').text().replace('|', '');
        let problemStatement = $('.problemStatement').text();
        if (problemStatement.startsWith(answerStatement)) {
            // console.log('前方一致');
            $('.answer span:not(#cursor)').attr('style', '');
            // 最後の文字を正しく入力したら完了
            if (answerStatement.length == problemStatement.length) {
                correctCheck();
            }
        } else {
            // console.log('非前方一致');
            $('.answer span:not(#cursor)').attr('style', 'color:red;');
        }
    }

    // 全文の正誤判定
    correctCheck = () => {
        // 解答を取得しカーソルの記号を削除
        let answerStatement = $('.answer').text().replace('|', '');

        let problemStatement = $('.problemStatement').text();
        // console.log(problemStatement);
        // console.log(answerStatement);

        if (answerStatement == problemStatement) {
            console.log('正解');
            $('.gameWindow').addClass('jello-horizontal');
        } else {
            console.log('不正解');
            $('.gameWindow').addClass('shake-horizontal');
        }
        $('.answer').html(`<span id='cursor'>|</span></p>`);
        drawConsole();
    }


    //0～指定した数までの乱数（整数）を返す関数
    getRandomInt = (max) => {
        return Math.floor(Math.random() * Math.floor(max));
    }

    // 初回の問題表示
    drawConsole();

})