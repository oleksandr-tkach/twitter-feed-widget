/**
 * Created by oleksandrtkach on 20/04/2017.
 */

/**
 * Includes:
 * twitter-feet-widget.css
 * font-awesome/css/font-awesome.css
 * http://fonts.googleapis.com/css?family=Quicksand:300,400
 * http://fonts.googleapis.com/css?family=Lato:400,300
 */

(function() {

    this.TwitterFeed = function () {

        var widgetClass = 'twitter-feed-widget',
            titleClass = 'twitter-timeline-title',
            listClass = 'twitter-timeline';

        var defaults = {
            feedTitle: '',
            tweets: [],
            wrapperId: 'twitted-feed-widget'
        };

        var template = '<div>' +
            '<div class="row">' +
            '<div class="col-xs-12">' +
            '<div class="'+ widgetClass +'">' +
            '<span class="'+ titleClass +'"></span><ul class="'+ listClass +'"></ul>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        }

        function extendDefaults(source, properties) {
            var property;
            for (property in properties) {
                if (properties.hasOwnProperty(property)) {
                    source[property] = properties[property];
                }
            }
            return source;
        }

        TwitterFeed.prototype.createWidget = function () {

            if(!Array.isArray(this.options.tweets) || this.options.tweets.length === 0) {
                console.error('Tweets array is empty.');
                return ;
            }

            var parent = document.getElementById(this.options.wrapperId);

            if(!parent) {
                console.error('Parent block cannot be found.');
                return ;
            }

            // insert default tpl
            parent.innerHTML = template;

            var title = document.getElementsByClassName(titleClass)[0];
            var list = document.getElementsByClassName(listClass)[0];

            title.appendChild(this.generateTitleHTML());

            for(var i = 0; i < this.options.tweets.length; i++) {
                var li = document.createElement('li');
                li.appendChild(this.generateTweetHTML(this.options.tweets[i]));
                list.appendChild(li);
            }
            return ;
        };

        TwitterFeed.prototype.generateTitleHTML = function () {
            return document.createTextNode(this.options.feedTitle);
        };

        TwitterFeed.prototype.generateTweetHTML = function (data) {
            var block = document.createElement("div");
            block.appendChild(this.generateAvatarHTML(data));
            block.appendChild(this.generateContentHTML(data));
            return block;
        };

        TwitterFeed.prototype.generateAvatarHTML = function (data) {
            var avatarBlock = document.createElement("div"),
                src = '',
                screen_name = '';

            if(data.retweeted_status && typeof data.retweeted_status === "object") {
                src = data.retweeted_status.user.profile_image_url_https;
                screen_name = data.retweeted_status.user.screen_name;
            }   else {
                src = data.user.profile_image_url_https;
                screen_name = data.user.screen_name;
            }
            src = src.replace(/_normal./g, "_400x400.");

            avatarBlock.className = 'twitter-avatar';
            avatarBlock.innerHTML = '<img src="' + src + '" /> <div class="hover" onclick=\'window.open("https://twitter.com/' + screen_name + '", "_blank");\'><i class="fa fa-twitter" style="margin-top: 5px;"></i></div>';
            return avatarBlock;
        };

        TwitterFeed.prototype.generateContentHTML = function (data) {
            var contentBlock = document.createElement("div"),
                subheader = '',
                header = '',
                content = '',
                footer = '';

            if(data.retweeted_status && typeof data.retweeted_status === "object") {
                subheader = this.prepareSubheader(data);
            }
            header = this.prepareHeader(data);
            content = this.prepareContent(data);
            footer = this.prepareFooter(data);

            contentBlock.className = 'twitter-feed-container';
            contentBlock.innerHTML = '<div class="twitter-feed-content">' +
                ( subheader.length > 0 ? '<h5>' + subheader + '</h5>' : '') +
                ( header.length > 0 ? '<h3>' + header + '</h3>' : '') +
                '<br />' +
                ( content.length > 0 ? '<p>' + content + '</p>' : '') +
                ( footer.length > 0 ? '<span>' + footer + '</span>' : '') +
                '</div>' +
                '<div class="twitter-feed-arrow"></div>';

            return contentBlock;
        };

        TwitterFeed.prototype.prepareSubheader = function (data) {
            return '@' + data.user.screen_name + ' Retweeted';
        };

        TwitterFeed.prototype.prepareHeader = function (data) {
            var result = '';
            if(data.retweeted_status && typeof data.retweeted_status === "object") {
                result = data.retweeted_status.user.name + ' ' + this.generateLinkHTML(
                    '@' + data.retweeted_status.user.screen_name,
                    data.retweeted_status.user.screen_name,
                    true
                );
            }   else {
                result = data.user.name + ' ' + this.generateLinkHTML(
                    '@' + data.user.screen_name,
                    data.user.screen_name,
                    true
                );
            }
            return result;
        };

        TwitterFeed.prototype.prepareContent = function (data) {
            var tweetData, result = '';
            // @TODO extended_entities (types: photo, multi photos, animated gifs or videos)
            // @TODO https://dev.twitter.com/overview/api/entities-in-twitter-objects
            if(data.retweeted_status && typeof data.retweeted_status === "object") {
                tweetData = data.retweeted_status;
            }   else {
                tweetData = data;
            }
            if(tweetData.full_text && tweetData.full_text.length > 0) {
                result = tweetData.full_text;
            }   else {
                result = tweetData.text;
            }
            for (var entity in tweetData.entities) {
                if (tweetData.entities.hasOwnProperty(entity)) {
                    result = this.replaceEntities(entity, result, tweetData.entities[entity]);
                }
            }
            return result;
        };

        TwitterFeed.prototype.replaceEntities = function (type, str, entities) {
            for(var i = 0; i < entities.length; i++) {
                switch(type) {
                    case 'hashtags':
                        str = this.replaceHashtags(str, entities[i]);
                        break;
                    case 'media':
                        str = this.replaceMedia(str, entities[i]);
                        break;
                    case 'symbols':
                        str = this.replaceSymbols(str, entities[i]);
                        break;
                    case 'urls':
                        str = this.replaceUrls(str, entities[i]);
                        break;
                    case 'user_mentions':
                        str = this.replaceUserMentions(str, entities[i]);
                        break;
                }
            }
            return str;
        };

        TwitterFeed.prototype.replaceHashtags = function (str, entity) {
            var replaceSubsting = function (str, substring, replacement, index) {
                return  str.substring(0, index) + (substring[0] !== '#' ? substring[0] : '') + replacement + str.substring(index + substring.length, str.length);
            };
            var match, re = /(?:^|\W)#(\w+)(?!\w)/g;
            while (match = re.exec(str)) {
                if(match[1] === entity.text) {
                    str = replaceSubsting(str, match[0], this.generateLinkHTML('#' + entity.text, '/hashtag/' + entity.text + '?src=hash', true), match.index);
                    break;
                }
            }
            return str;
        };

        TwitterFeed.prototype.replaceMedia = function (str, entity) {
            var rgx;
            switch(entity.type) {
                case 'photo':
                    rgx = new RegExp(entity.url);
                    str = str.replace(rgx, this.generateImageHTML(entity.expanded_url, entity.media_url_https));
                    break;
            }

            return str;
        };

        TwitterFeed.prototype.replaceSymbols = function (str, entity) {
            var rgx = new RegExp('\$' + entity.text);
            return str.replace(rgx, this.generateLinkHTML('$' + entity.text, 'search?q=%24' + entity.text + '&src=ctag', true));
        };

        TwitterFeed.prototype.replaceUrls = function (str, entity) {
            var rgx = new RegExp(entity.url);
            return str.replace(rgx, this.generateLinkHTML(entity.display_url, entity.url, true));
        };

        TwitterFeed.prototype.replaceUserMentions = function (str, entity) {
            var rgx = new RegExp('\@' + entity.screen_name);
            return str.replace(rgx, this.generateLinkHTML('@' + entity.screen_name, entity.screen_name, true));
        };

        TwitterFeed.prototype.prepareFooter = function (data) {
            var result = '';
            result += this.generateLinkHTML('<i class="fa fa-link" aria-hidden="true"></i>', data.user.screen_name + '/status/' + data.id_str, true, 'tweet-link');
            result += '<span class="tweet-created-at">' + this.formatDate(data.created_at) + '</span>';
            return result;
        };

        TwitterFeed.prototype.formatDate = function (created_at) {
            var date = new Date(created_at);
            var monthNames = [
                "Jan", "Feb", "Mar",
                "Apr", "May", "Jun", "Jul",
                "Aug", "Sep", "Oct",
                "Nov", "Dec"
            ];
            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();
            return monthNames[monthIndex] + ' ' + day + ( new Date().getFullYear() !== year ? ( ' ' + year ) : '' );
        };

        TwitterFeed.prototype.generateLinkHTML = function (content, url, blank, class_name) {
            var target = blank ? 'target="_blank"' : '';
            var className = class_name ? 'class="'+ className + '"' : '';
            if(url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
                url = 'https://twitter.com' + ( url[0] !== '/' ? '/' : '' ) + url;
            }
            return '<a href="' + url + '" ' + target + ' ' + className + '>' + content + '</a>';
        };

        TwitterFeed.prototype.generateImageHTML = function (link, src) {
            return '<br /><a href="' + link + '" target="_blank"><img src="' + src + '" title="View image on Twitter" class="twitter-media-img" /></a>';
        };

    };

}());