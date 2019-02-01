
var addMessage = (id, message, read) => {
    return '<div class="col-xs-12 col-md-6 col-md-offset-3 message" data-value="' + id + '">' +
    '<div class="col-xs-2"><button class="read-button">' + (read === true ? '☑' : '☐') + '</button></div>' +
    '<div class="col-xs-10"><p>' + message + '</p></div>' +
    '</div>';
};

var reloadMessages = () => {
    $.get('http://localhost:8000/getall', (data, status, jqXHR) => {
        if (status === 'success') {
            $( ".message" ).remove();
            data.forEach(item => $('.messages').prepend(addMessage(item._id, item.message, item.read)));
        }
    });
};

$(() => {
    $.get('http://localhost:8000/getall', (data, status, jqXHR) => {
        if (status === 'success') {
            data.forEach(item => $('.messages').prepend(addMessage(item._id, item.message, item.read)));
        }
    });

    $('#new-message').submit(function (event) {
        event.preventDefault();
        var input = $(this).find('[id=input-text]');

        if (input.val().length > 140 || input.val().length === 0) {
            var error_box = $('#error');
            error_box.removeClass('hide');
            window.setTimeout(() => error_box.addClass('hide'), 4000);
        } else {
            $.get('http://localhost:8000/save?message=' + encodeURIComponent(input.val()), (data, status, jqXHR) => {
                if (status === 'success') {
                    reloadMessages();
                    input.val('');
                }
            });
        }
    });

    $('.messages').on('click', '.read-button', function (event) {
        var button = $(this);
        var id = button.parent().parent().attr('data-value');
        $.get('http://localhost:8000/flag?id=' + encodeURIComponent(id), (data, status, jqXHR) => {
            if (status === 'success') {
                if (button.html() === '☐') {
                    button.html('☑');
                    button.parent().parent().toggleClass('read');
                } else {
                    button.html('☐');
                    button.parent().parent().toggleClass('read');
                }
            }
        });
    });
});
