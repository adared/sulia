/**
 * Sulia deals page
 *
 * Author: Ada Meyers
 *
 * Copyright Sulia 2013
 */

window.sulia = window.sulia || {};
window.sulia.page = window.sulia.page || {};
window.sulia.page.deal = {
    render_posts: function() {
        var content_html = '';
        $.each(window.sulia.data.posts, function(index, post) {
            content_html += Handlebars.templates.content_section({post: post});
        });
        $('div.deal_posts').html(content_html).find('.timeago').timeago();
    },

    render_post_table: function() {
        var content_html = '',
            URL_LEN = 19;
        $.each(window.sulia.data.posts, function(index, post) {
            post.sum_qual_ref = window.sulia.page.deal.sum_referrals(post.qualified_referrals);
            post.trunc_link = window.sulia.page.deal.truncate_link(post.sulia_select_url, URL_LEN);
            post.value_currency = window.sulia.page.deal.display_currency(post.value);
            content_html += Handlebars.templates.deal_post_table(post);
        });
        $('#post_table .table_head').after(content_html);
    },

    render_post_popup: function(post) {
        $.fancybox({
            content: Handlebars.templates.deal_post_popup(post),
            padding: 0
        });
        window.sulia.page.deal.insert_ref_values(post);
        $('body').on('click', '.close_button', $.fancybox.close;
    },

    render_post_graph: function() {
        var context = window.sulia.page.deal.post_graph_values();
        $('#referrals_graph').after(Handlebars.templates.post_graph(context));
        if (!(context.has_value)) {
            $('.graph-exp').addClass('no-avg');
            $('.graph-dets').addClass('centered');
        }
        window.sulia.page.deal.animate_post_graph(context);
    },

    //gets post graph value dict
    post_graph_values: function() {
        var qual_post_count = 0,
            post_count = 0,
            total_value = 0,
            target_posts = 0,
            values = {};
        $.each(window.sulia.data.posts, function(index, post) {
            if (post.qualified) {
                qual_post_count += 1;
            }
            post_count += 1;
            total_value += post.value;
        });
        values.num_posts = qual_post_count;
        if (window.sulia.data.posts.length > 0) {
            values.avg = (total_value/post_count).toFixed(2);
            target_posts += Math.ceil((window.sulia.data.target/(total_value/post_count)));
            if (window.sulia.data.min_posts > target_posts) {
                values.target_posts = window.sulia.data.min_posts;
            } else {
                values.target_posts = target_posts;
            }
        }
        values.has_value = total_value > 0;
        return values;
    },

    //returns percentages for proportionate number values
    bar_size: function(values) {
        var sizes = [ ],
            i,
            max = Math.max.apply(Math, values),
            num_values = values.length;
        for (i=0; i < num_values; i++) {
            if (max === 0) {
                sizes.push(1);
            } else {
               var height = values[i]/max * 100;
               if (height < 1){
                   sizes.push(1);
               } else {
                   sizes.push(height);
               }
            }
        }
        return sizes;
    },

    //animates and gets width values for cash bar graph
    initialize_earned: function() {
        var margin = 12;
        if (window.sulia.data.page_id === 'deal_specific' && !(window.sulia.data.is_qualified)) {
            $("#total_earned").css("background-color", "#b0b0b0");
        }
        if (window.sulia.data.percent_complete === 0 && window.sulia.data.current > 0) {
            $('#total_earned').animate({
                width: ".2%"
            }, 500, function() {
                $(this).css("overflow", "visible");
                $("#total_percent").removeClass('hidden');
                $("#remaining_current").css("margin-left", "0%");
                $('#remaining_current').removeClass('hidden');
                $('#remaining_target').removeClass('hidden');
            });
        } else {
            $('#total_earned').animate({
                width: String(window.sulia.data.percent_complete) + "%"
            }, 1200, function() {
                $(this).css("overflow", "visible");
                $("#total_percent").removeClass('hidden');
                if ($(this).width() > $("#earned_current").width() + margin) {
                    $('#earned_current').removeClass('hidden');
                } else {
                    $("#remaining_current").css("margin-left", function() {
                        return String(window.sulia.data.percent_complete) + "%";
                    });
                    $('#remaining_current').removeClass('hidden');
                }
                if ($('#total_remaining').width() - $("#total_earned").width() > $("#remaining_target").width() + margin) {
                    $('#remaining_target').removeClass('hidden');
                } else {
                    $('#earned_target').removeClass('hidden');
                }
            });
        }
    },

    //animates and gets width values for post graph
    animate_post_graph: function(values) {
        var margin = 12,
            percent = values.num_posts/values.target_posts * 100;
        if (values.has_value) {
            if (values.num_posts < values.target_posts) {
                $('.posts-current').animate({
                    width: String(percent) + "%"
                }, 1200, function() {
                    if ($(this).width() > $(".current-num-posts").width() + margin) {
                        $('.current-num-posts').removeClass('hidden');
                    } else {
                        $(".rem-num-posts").css("margin-left", function() {
                            return String(percent) + "%";
                        });
                        $('.rem-num-posts').removeClass('hidden');
                    }
                    if ($('.graph-shell').width() - $(".posts-current").width() > $(".rem-target-posts").width() + margin) {
                        $('.rem-target-posts').removeClass('hidden');
                    } else {
                        $('.current-target-posts').removeClass('hidden');
                    }
                });
            } else {
                $('.posts-current').animate({
                    width: "100%"
                }, 1200, function() {
                    $('.current-num-posts').removeClass('hidden');
                    $('.current-target-posts').removeClass('hidden');
                });
            }
        } else {
            $(".rem-num-posts").css("margin-left", "0%");
            $('.rem-target-posts').removeClass('hidden');
            $('.rem-num-posts').removeClass('hidden');
        }
    },

    //checks if all values are the same
    check_equal: function(lst, value) {
        var num_values = lst.length,
            i;
        for (i=0; i<num_values; i++ ) {
            if (lst[i] !== value) {
                return false;
            }
        }
        return true;
    },

    //uses values to initialize graph on page
    initialize_referrals: function() {
        var ratios = [
            window.sulia.data.qualified_referrals.us_desk, 
            window.sulia.data.qualified_referrals.us_mob, 
            window.sulia.data.qualified_referrals.intl_desk, 
            window.sulia.data.qualified_referrals.intl_mob
        ];
        window.sulia.page.deal.identify_qualified('#us_desk_qualified', '#us_desk_ref');
        window.sulia.page.deal.identify_qualified('#us_mob_qualified', '#us_mob_ref');
        window.sulia.page.deal.identify_qualified('#intl_desk_qualified', '#intl_desk_ref');
        window.sulia.page.deal.identify_qualified('#intl_mob_qualified', '#intl_mob_ref');
        window.sulia.page.deal.animate_widths('.bar_in_chart', ratios);
    },

    //makes qualified referral bars green
    identify_qualified: function(qual, ref) {
        if ( $(qual).length > 0) {
            $(ref).css("background-color", "rgb(44,180,20)");
        }
    },

    //makes table rows clickable and have hover functionality
    clickable_row: function() {
        if (window.sulia.data.page_id === 'deal_overview' || window.sulia.data.page_id === 'deal_week') {
            $(".clickable_row").click(function() {
                location.href = $(this).data('url');
            });
        }
        $(".clickable_row")
            .mouseover(function() {
                $(this).addClass('hover');
            })
            .mouseout(function(){
                $(this).removeClass('hover');
        });
    },

    //animates widths of bars based on values
    animate_widths: function(bar, values) {
        var $bar = $(bar),
            sizes = [],
            i;
        if ($bar.hasClass("percent-bar")) {
            sizes = values;
            for(i=0; i < sizes.length; i++) {
                if(sizes[i] === 0) {
                    sizes[i] = 1;
                }
            }
        } else {
            sizes = window.sulia.page.deal.bar_size(values);
        }
        $bar.css("width", function(index) {
            return String(sizes[index]) + "%";
        });
        $bar.each(function(index) {
            if ($(this).width() > $(this).children().width() + 10) {
                $(this).children().removeClass("hidden");
            } else {
                $(this).siblings().removeClass("hidden").css("display", "inline-block");
            }
        });

    },

    //colors week deals charts according to width
    //separated into six color groups
    color_graphs: function(bar, values, color) {
        var $bar = $(bar),
            sizes = [];
        if ($bar.hasClass("percent-bar")) {
            sizes = values;
        } else {
            sizes = window.sulia.page.deal.bar_size(values);
        }
        $bar.each(function(index) {
            if (sizes[index] <= 16.6) {
                $(this).addClass(color + '16');
            }
            else if (sizes[index] <= 33.2) {
                $(this).addClass(color + '33');
            }
            else if (sizes[index] <= 49.8) {
                $(this).addClass(color + '50');
            }
            else if (sizes[index] <= 66.4) {
                $(this).addClass(color + '66');
            }
            else if (sizes[index] <= 83) {
                $(this).addClass(color + '83');
            }
            else {
                $(this).addClass(color + '100');
            }
        });
    },

    //scroll to element on click
    scroll_to: function(element) {
        $('html, body').animate({
            scrollTop: $(element).offset().top},
            300);
    },

    //truncates string to certain characters
    truncate_link: function(str, length) {
        if (str === null || str === undefined) {
            return str;
        } else {
            return str.length > length ? str.substring(7, length + 4) + '...' : str;
        }
    },

    //gets number of qualified referrals from data
    sum_referrals: function(qual_refs) {
        var sum = 0;
        if (window.sulia.data.qual_ref.us_desk > 0) {
            sum += qual_refs.us_desk;
        }
        if (window.sulia.data.qual_ref.us_mob > 0) {
            sum += qual_refs.us_mob;
        }
        if (window.sulia.data.qual_ref.intl_desk > 0) {
            sum += qual_refs.intl_desk;
        }
        if (window.sulia.data.qual_ref.intl_mob > 0) {
            sum += qual_refs.intl_mob;
        }
        return sum;
    },

    //gets bar widths for post table
    initialize_post_graphs: function() {
        var earned_values = [],
            ref_values = [];
        $.each(window.sulia.data.posts, function(index, post) {
            earned_values.push(post.value);
            ref_values.push(post.sum_qual_ref);
        });
        window.sulia.page.deal.animate_widths('.post-earn-bar', earned_values);
        window.sulia.page.deal.animate_widths('.post-ref-bar', ref_values);
    },

    //changes post table earned to currency
    display_currency: function(value) {
        return value.toFixed(2);
    },

    //gets values for referrals table
    insert_ref_values: function(post) {
        var us_desk = post.qualified_referrals.us_desk * window.sulia.data.qual_ref.us_desk / 100,
            us_mob = post.qualified_referrals.us_mob * window.sulia.data.qual_ref.us_mob / 100,
            us = us_desk + us_mob,
            intl_desk = post.qualified_referrals.intl_desk * window.sulia.data.qual_ref.intl_desk / 100,
            intl_mob = post.qualified_referrals.intl_desk * window.sulia.data.qual_ref.intl_desk / 100,
            intl = intl_desk + intl_mob,
            values = [us.toFixed(2), us_desk.toFixed(2), us_mob.toFixed(2), intl.toFixed(2), intl_desk.toFixed(2), intl_mob.toFixed(2)];
        $('.popup-refs-row .earn-cell').text(function(index) {
            if (values[index] === '0.00') {
                return "- -";
            } else {
                return "$" + values[index];
            }
        });
    },

    //makes posts hidden
    hide_posts: function() {
        if (window.sulia.data.posts.length > 5) {
            $('.post-item').each(function(index) {
                if (index > 4) {
                    $(this).addClass('hidden').addClass('unviewed');
                }
            });
            $('.post-control').click(function() {
                $('.post-control').toggleClass('hidden');
                $('.unviewed').toggleClass('hidden');
            });
        } else if (window.sulia.data.posts.length > 0){
            $('.post-control').addClass('hidden');
        } else {
            $('.post-control').addClass('hidden');
            $('#deal_posts').addClass('hidden');
        }
    },

    //make dropdowns functional
    clickable_response: function() {
        $('.clickable_response').click(function(event) {
            event.stopPropagation();
            $(this).children('.deal_respond').toggleClass('hidden');
            $(this).children('.payment_details').toggleClass('hidden');
        });

        $(document).click(function(){
            $(".deal_respond").addClass('hidden');
            $(".payment_details").addClass('hidden');
        });

        $(".deal_respond > div")
            .mouseover(function(event) {
                event.stopPropagation();
                $(".deal_list_item").removeClass('hover');
                $(this).addClass('hover');
            })
            .mouseout(function(){
                $(this).removeClass('hover');
            });
    },

    //formats post dates
    format_date: function() {
        var postdates = [],
            options = {hour: '2-digit', minute:'2-digit'};
        $.each(window.sulia.data.posts, function(index, post) {
            postdates.push(new Date(post.timestamp * 1000));
        });
        $(".post-date").each(function(index) {
            $(this).text(postdates[index].toLocaleDateString());
        });
        $(".post-time").each(function(index) {
            $(this).text(postdates[index].toLocaleTimeString("en-US", options));
        });
    },

    //accepts or declines deal
    initialize_accept: function() {
        $(".deal_respond_yes").click(function() {
            var deal_id = $(this).closest('.deal_respond').data('deal');
            window.sulia.page.deal.deal_accept_handler(deal_id, true);
        });
        $(".deal_respond_no").click(function() {
            var deal_id = $(this).closest('.deal_respond').data('deal');
            window.sulia.page.deal.deal_accept_handler(deal_id, false);
        });
    },

    //accepts or declines deal
    deal_accept_handler: function(deal_id, status) {
        $.ajax({
            type: "POST",
            url: '/ajax/accept_deal/',
            data: {
                deal_id: deal_id,
                status: status
            },
            success: function(data) {
                var html;
                if (status) {
                    html = '<img class="status_icon" src="' + window.sulia.media_url + 'images/greencheck.png" /> <p>Accepted</p> <div class="vertical_rule"></div>';
                } else {
                    html = '<img class="status_icon" src="' + window.sulia.media_url + 'images/red-ex.png" /> <p>Declined</p> <div class="vertical_rule"></div>';
                }
                $('.deal_respond[data-deal=' + deal_id + ']').closest(".status_cell").html(html);
            }
        });
    },

    //animates and gets widths for week graphs
    initialize_week_graphs: function() {
        var len = window.sulia.data.avg_vals.length,
            num = 0,
            i = 0;
        for (i; i < len; i++) {
            num = window.sulia.data.avg_vals[i];
            if (window.sulia.data.avg_vals[i] !== num) { //checks if num is Nan
                window.sulia.data.avg_vals[i] = 0;
            }
        }
        window.sulia.page.deal.animate_widths('.avg-val-bar', window.sulia.data.avg_vals);
        window.sulia.page.deal.animate_widths('.num-posts-bar', window.sulia.data.post_count);
        window.sulia.page.deal.animate_widths('.earned-bar', window.sulia.data.earned_vals);
        window.sulia.page.deal.animate_widths('.percent-bar', window.sulia.data.percent_vals);
        window.sulia.page.deal.color_graphs('.avg-val-bar', window.sulia.data.avg_vals, "grn");
        window.sulia.page.deal.color_graphs('.num-posts-bar', window.sulia.data.post_count, "blu");
        window.sulia.page.deal.color_graphs('.earned-bar', window.sulia.data.earned_vals, "grn");
        window.sulia.page.deal.color_graphs('.percent-bar', window.sulia.data.percent_vals, "org");
    }
};

$(document).ready(function () {
    if (window.sulia.data.page_id === 'deal_page') {
        window.sulia.page.deal.render_posts();
    }
    else if (window.sulia.data.page_id === 'deal_week') {
        window.sulia.page.deal.initialize_earned();
        window.sulia.page.deal.initialize_week_graphs();
        window.sulia.page.deal.clickable_row();
        window.sulia.page.deal.clickable_response();
        window.sulia.page.deal.initialize_accept();
    }
    else if (window.sulia.data.page_id === 'deal_specific') {
        window.sulia.page.deal.initialize_earned();
        // Checking for qualified referrals
        window.sulia.page.deal.initialize_referrals();
        window.sulia.page.deal.render_post_graph();
        window.sulia.page.deal.render_post_table();
        window.sulia.page.deal.initialize_post_graphs();
        window.sulia.page.deal.format_date();
        window.sulia.page.deal.hide_posts();
        window.sulia.page.deal.clickable_row();
        window.sulia.page.deal.clickable_response();
        window.sulia.page.deal.initialize_accept();
        $(".post-item").click(function() {
            var id = $(this).attr('id');
            $.each(window.sulia.data.posts, function(index, post) {
                if (post.post_id === id) {
                    window.sulia.page.deal.render_post_popup(post);
                    return false;
                }
            });
        });
    }
    else if (window.sulia.data.page_id === 'deal_overview') {
        window.sulia.page.deal.clickable_row();

        $('.month_table').first().children().removeClass('hidden');
        $('.month_table').first().find('.chevron').removeClass('right').addClass('bottom');

        $('thead').click(function() {
            $(this).find('.chevron').toggleClass('right').toggleClass('bottom');
            $(this).siblings().toggleClass('hidden');
            window.sulia.page.deal.scroll_to(this);
        });
    }
});