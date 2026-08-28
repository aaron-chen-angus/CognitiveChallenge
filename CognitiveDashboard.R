# ==============================================================================
# Cognitive Performance Challenge — R Shiny Dashboard
# ------------------------------------------------------------------------------
# Live data source : Google Sheet (read directly at runtime, no GitHub relay)
# Built on         : the supplied ShinyTemplate.R (X–Y scatter + brush → table)
# Schema           : the 36 exported fields documented in the app README (§4)
#
# Tabs:
#   1. Scatter Explorer  – X/Y continuous pickers, colour by category, size &
#                          opacity sliders, hover tooltip, brush-select → table
#                          + descriptive & correlation statistics of selection.
#   2. Distributions     – histogram of any continuous field; x-brush isolates a
#                          value range → rows + summary of the isolated subset.
#   3. Group Comparison  – boxplot of a continuous field by a categorical field;
#                          isolates per-group summary stats + omnibus test.
#   4. Correlations      – correlation heatmap of chosen numeric fields; isolates
#                          the correlation matrix as a table.
#   5. Data Explorer     – full, filterable live table of all fields + download.
#
# Data-quality note (from README §4/§20): the Apps Script writes `field || ''`,
# so a genuine 0 (e.g. reactionFalseStarts, memoryExactCorrect,
# puzzleUnproductiveMoves, calcAccuracy) is stored as a BLANK cell. Blanks are
# therefore read as NA here and are NOT auto-converted to 0, because a blank can
# also mean a skipped station. Interpret accordingly.
# ==============================================================================


# ---- Packages ----------------------------------------------------------------
library(shiny)
library(ggplot2)
library(tools)
library(shinythemes)
library(dplyr)
library(DT)


# ---- Data source & schema ----------------------------------------------------

# Public sheet -> CSV via the GViz endpoint (works when "Anyone with the link
# can view"). This is the live feed read directly by the app.
SHEET_CSV <- paste0(
  "https://docs.google.com/spreadsheets/d/",
  "153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA",
  "/gviz/tq?tqx=out:csv"
)

# Numeric (continuous) fields per the README data dictionary.
NUM_COLS <- c(
  "age",
  "reactionBest", "reactionMean", "reactionMedian", "reactionSD",
  "reactionRange", "reactionSlowest", "reactionFalseStarts",
  "reactionAttempt1", "reactionAttempt2", "reactionAttempt3",
  "memoryExactCorrect", "memoryAccuracy", "memoryAdjacentPairs", "memoryRecallTime",
  "calcStartNumber", "calcAbsoluteCorrect", "calcAccuracy",
  "calcSequentialConsistency", "calcTotalTime", "calcAvgResponseTime",
  "calcFirstErrorPosition",
  "puzzleCompletionTime", "puzzleMoves", "puzzleUnproductiveMoves"
)

# Categorical fields.
CAT_COLS <- c("gender", "memoryPerfectSequence", "puzzleId", "puzzleFirstMoveAccuracy")

# All expected columns (used to build a safe empty frame if the feed is down).
ALL_COLS <- c(
  "timestamp", "nickname", "age", "gender",
  NUM_COLS[NUM_COLS != "age"],
  "memoryPerfectSequence", "memoryPresentedOrder", "memorySubmittedOrder",
  "calcSubtractionValue", "calcExpectedAnswers", "calcSubmittedAnswers",
  "puzzleId", "puzzleFirstMoveAccuracy"
)
ALL_COLS <- unique(ALL_COLS)

# Friendly labels for the continuous X/Y/variable pickers.
CONT_CHOICES <- c(
  "Age (years)"                       = "age",
  "Reaction — Best (ms)"              = "reactionBest",
  "Reaction — Mean (ms)"              = "reactionMean",
  "Reaction — Median (ms)"            = "reactionMedian",
  "Reaction — SD (ms)"                = "reactionSD",
  "Reaction — Range (ms)"             = "reactionRange",
  "Reaction — Slowest (ms)"           = "reactionSlowest",
  "Reaction — False starts (n)"       = "reactionFalseStarts",
  "Reaction — Attempt 1 (ms)"         = "reactionAttempt1",
  "Reaction — Attempt 2 (ms)"         = "reactionAttempt2",
  "Reaction — Attempt 3 (ms)"         = "reactionAttempt3",
  "Memory — Exact correct (0–5)"      = "memoryExactCorrect",
  "Memory — Accuracy (%)"             = "memoryAccuracy",
  "Memory — Adjacent pairs (0–4)"     = "memoryAdjacentPairs",
  "Memory — Recall time (s)"          = "memoryRecallTime",
  "Calc — Absolute correct (0–5)"     = "calcAbsoluteCorrect",
  "Calc — Accuracy (%)"               = "calcAccuracy",
  "Calc — Sequential consistency (%)" = "calcSequentialConsistency",
  "Calc — Total time (s)"             = "calcTotalTime",
  "Calc — Avg response time (s)"      = "calcAvgResponseTime",
  "Calc — First error position"       = "calcFirstErrorPosition",
  "Puzzle — Completion time (s)"      = "puzzleCompletionTime",
  "Puzzle — Moves (n)"                = "puzzleMoves",
  "Puzzle — Unproductive moves (n)"   = "puzzleUnproductiveMoves"
)

# Friendly labels for the categorical (colour / grouping) pickers.
CAT_CHOICES <- c(
  "Gender"                   = "gender",
  "Age group"                = "ageGroup",
  "Puzzle image"             = "puzzleId",
  "Perfect memory sequence"  = "memoryPerfectSequence",
  "Productive first move"    = "puzzleFirstMoveAccuracy"
)

# Compact set of identifying + headline-domain fields for the selection table.
REP_FIELDS <- c("nickname", "age", "gender",
                "reactionBest", "memoryAccuracy", "calcAccuracy",
                "puzzleCompletionTime")

# Default numeric fields for the correlation heatmap (kept small & readable).
CORR_DEFAULT <- c("age", "reactionBest", "reactionMean", "memoryAccuracy",
                  "memoryRecallTime", "calcAccuracy", "calcTotalTime",
                  "puzzleCompletionTime", "puzzleMoves")


# ---- Data loader -------------------------------------------------------------

empty_frame <- function() {
  df <- as.data.frame(matrix(nrow = 0, ncol = length(ALL_COLS)))
  names(df) <- ALL_COLS
  df$ageGroup <- factor(character(0))
  df$timestamp_parsed <- as.POSIXct(character(0))
  df
}

load_cognitive_data <- function() {
  df <- tryCatch(
    read.csv(SHEET_CSV, header = TRUE, stringsAsFactors = FALSE,
             check.names = TRUE, na.strings = c("", "NA", "N/A")),
    error = function(e) NULL
  )
  if (is.null(df) || nrow(df) == 0) return(empty_frame())

  # Coerce documented numeric columns (blanks -> NA; see data-quality note).
  for (cc in intersect(NUM_COLS, names(df))) {
    df[[cc]] <- suppressWarnings(as.numeric(df[[cc]]))
  }
  # Categoricals -> factors (trim stray whitespace).
  for (cc in intersect(CAT_COLS, names(df))) {
    df[[cc]] <- as.factor(trimws(as.character(df[[cc]])))
  }
  # Parse ISO-8601 timestamp (fall back to generic parse).
  if ("timestamp" %in% names(df)) {
    tp <- suppressWarnings(as.POSIXct(df$timestamp,
                                      format = "%Y-%m-%dT%H:%M:%OSZ", tz = "UTC"))
    if (all(is.na(tp))) tp <- suppressWarnings(as.POSIXct(df$timestamp))
    df$timestamp_parsed <- tp
  }
  # Screen impossible ages (app form permits 1–120; README §10.9). Out-of-range
  # values are set to NA so age-based plots ignore them WITHOUT discarding the
  # rest of that session's cognitive data on other tabs.
  if ("age" %in% names(df)) {
    df$age[!is.na(df$age) & (df$age < 1 | df$age > 120)] <- NA
  }
  # Derived age group for grouping/colour.
  if ("age" %in% names(df)) {
    df$ageGroup <- cut(df$age,
                       breaks = c(-Inf, 18, 30, 45, 60, Inf),
                       labels = c("≤18", "19–30", "31–45", "46–60", "60+"))
  }
  df
}

# Small helper: describe a numeric vector as a one-row data frame.
describe_num <- function(x, label) {
  x <- x[is.finite(x)]
  data.frame(
    Variable = label,
    n        = length(x),
    Mean     = ifelse(length(x) > 0, round(mean(x), 2), NA),
    Median   = ifelse(length(x) > 0, round(median(x), 2), NA),
    SD       = ifelse(length(x) > 1, round(sd(x), 2), NA),
    Min      = ifelse(length(x) > 0, round(min(x), 2), NA),
    Max      = ifelse(length(x) > 0, round(max(x), 2), NA),
    check.names = FALSE, stringsAsFactors = FALSE
  )
}


# ---- UI ----------------------------------------------------------------------

ui <- navbarPage(
  title = "Cognitive Performance Dashboard",
  theme = shinytheme("flatly"),
  header = tags$head(tags$style(HTML("
    .tooltip-box {
      position: absolute; z-index: 100; pointer-events: none;
      background: rgba(33,37,41,0.92); color: #fff; padding: 6px 9px;
      border-radius: 6px; font-size: 12px; line-height: 1.35;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .plot-wrap { position: relative; }
    .status-note { color: #6c757d; font-size: 12px; }
  "))),

  # ---------------------------------------------------------------- Tab 1 ----
  tabPanel(
    "Scatter Explorer",
    sidebarLayout(
      sidebarPanel(
        width = 3,
        selectInput("x", "X-axis (explanatory):", CONT_CHOICES, selected = "age"),
        selectInput("y", "Y-axis (outcome):",     CONT_CHOICES, selected = "reactionBest"),
        selectInput("z", "Colour by:",            CAT_CHOICES,  selected = "gender"),
        sliderInput("size",  "Point size:",    min = 0, max = 6, value = 2.5, step = 0.5),
        sliderInput("alpha", "Point opacity:", min = 0, max = 1, value = 0.6, step = 0.05),
        selectInput("trend_method", "Trend line:",
                    c("None" = "none", "Linear (lm)" = "lm",
                      "Smoothed (LOESS)" = "loess"),
                    selected = "lm"),
        tags$hr(),
        textInput("plot_title", "Plot title", placeholder = "Optional custom title"),
        actionButton("update_plot_title", "Update title", class = "btn-sm"),
        tags$hr(),
        actionButton("refresh_btn", "Refresh data now", class = "btn-sm btn-primary"),
        div(class = "status-note", textOutput("status"))
      ),
      mainPanel(
        width = 9,
        div(class = "plot-wrap",
            plotOutput("scatterplot", height = "460px",
                       hover = hoverOpts(id = "plot_hover", delay = 60,
                                         delayType = "debounce"),
                       brush = brushOpts(id = "plot_brush")),
            uiOutput("hover_tooltip")
        ),
        helpText("Drag a box over the points to select them. ",
                 "Selected sessions appear below with descriptive statistics."),
        tags$hr(),
        fluidRow(
          column(7,
                 h5("Selected sessions"),
                 DT::dataTableOutput("sel_table")),
          column(5,
                 h5("Statistics for selection"),
                 tableOutput("sel_stats"),
                 uiOutput("sel_corr"))
        )
      )
    )
  ),

  # ---------------------------------------------------------------- Tab 2 ----
  tabPanel(
    "Distributions",
    sidebarLayout(
      sidebarPanel(
        width = 3,
        selectInput("dist_var", "Variable:", CONT_CHOICES, selected = "reactionBest"),
        sliderInput("dist_bins", "Bins:", min = 5, max = 60, value = 25),
        checkboxInput("dist_norm", "Overlay normal curve", value = TRUE),
        selectInput("dist_fill", "Facet / fill by:",
                    c("None" = "none", CAT_CHOICES), selected = "none"),
        helpText("Drag horizontally across the histogram to isolate a value ",
                 "range; the rows in that range and their summary appear below.")
      ),
      mainPanel(
        width = 9,
        plotOutput("distplot", height = "420px",
                   brush = brushOpts(id = "dist_brush", direction = "x")),
        tags$hr(),
        fluidRow(
          column(4, h5("Isolated range — summary"), tableOutput("dist_stats")),
          column(8, h5("Isolated rows"), DT::dataTableOutput("dist_table"))
        )
      )
    )
  ),

  # ---------------------------------------------------------------- Tab 3 ----
  tabPanel(
    "Group Comparison",
    sidebarLayout(
      sidebarPanel(
        width = 3,
        selectInput("grp_cat", "Group (X, categorical):", CAT_CHOICES, selected = "puzzleId"),
        selectInput("grp_y",   "Measure (Y, continuous):", CONT_CHOICES, selected = "puzzleCompletionTime"),
        checkboxInput("grp_points", "Overlay individual points", value = TRUE),
        radioButtons("grp_test", "Omnibus test:",
                     c("Kruskal–Wallis (non-parametric)" = "kw",
                       "One-way ANOVA (parametric)" = "aov"),
                     selected = "kw"),
        helpText("The per-group summary table and the omnibus test are the ",
                 "isolated data products of this plot.")
      ),
      mainPanel(
        width = 9,
        plotOutput("boxplot", height = "420px"),
        tags$hr(),
        h5("Per-group summary (isolated)"),
        tableOutput("grp_stats"),
        h5("Omnibus test"),
        verbatimTextOutput("grp_testout")
      )
    )
  ),

  # ---------------------------------------------------------------- Tab 4 ----
  tabPanel(
    "Correlations",
    sidebarLayout(
      sidebarPanel(
        width = 3,
        selectInput("corr_vars", "Numeric fields:", CONT_CHOICES,
                    selected = CORR_DEFAULT, multiple = TRUE),
        radioButtons("corr_method", "Method:",
                     c("Spearman (robust to skew)" = "spearman",
                       "Pearson (linear)" = "pearson"),
                     selected = "spearman"),
        helpText("Correlations use pairwise-complete observations. The matrix ",
                 "below is the isolated data product.")
      ),
      mainPanel(
        width = 9,
        plotOutput("corrplot", height = "480px"),
        tags$hr(),
        h5("Correlation matrix (isolated)"),
        DT::dataTableOutput("corr_table")
      )
    )
  ),

  # ---------------------------------------------------------------- Tab 5 ----
  tabPanel(
    "Data Explorer",
    fluidPage(
      br(),
      downloadButton("dl_csv", "Download current data (CSV)", class = "btn-sm"),
      br(), br(),
      DT::dataTableOutput("explorer")
    )
  )
)


# ---- Server ------------------------------------------------------------------

server <- function(input, output, session) {

  # Live data: reload on button press and automatically every 60 s.
  cognitive_data <- reactive({
    input$refresh_btn
    invalidateLater(60000, session)
    load_cognitive_data()
  })

  output$status <- renderText({
    df <- cognitive_data()
    paste0(nrow(df), " sessions loaded · updated ",
           format(Sys.time(), "%H:%M:%S"))
  })

  # ---- Tab 1: Scatter -------------------------------------------------------

  new_plot_title <- eventReactive(input$update_plot_title, {
    toTitleCase(input$plot_title)
  }, ignoreNULL = FALSE)

  scatter_base <- reactive({
    df <- cognitive_data()
    validate(need(nrow(df) > 0, "Waiting for data from the live sheet…"))
    validate(need(input$x %in% names(df) && input$y %in% names(df),
                  "Selected variable not present in the data."))
    df
  })

  output$scatterplot <- renderPlot({
    df <- scatter_base()
    ttl <- if (isTruthy(new_plot_title()) && nzchar(new_plot_title())) {
      new_plot_title()
    } else {
      paste(names(CONT_CHOICES)[CONT_CHOICES == input$y], "vs",
            names(CONT_CHOICES)[CONT_CHOICES == input$x])
    }
    p <- ggplot(df, aes(x = .data[[input$x]], y = .data[[input$y]],
                        colour = .data[[input$z]])) +
      geom_point(size = input$size, alpha = input$alpha, na.rm = TRUE) +
      labs(title = ttl,
           x = names(CONT_CHOICES)[CONT_CHOICES == input$x],
           y = names(CONT_CHOICES)[CONT_CHOICES == input$y],
           colour = names(CAT_CHOICES)[CAT_CHOICES == input$z]) +
      theme_minimal(base_size = 13)
    if (input$trend_method != "none") {
      p <- p + geom_smooth(method = input$trend_method, se = TRUE, na.rm = TRUE,
                           colour = "grey25", linewidth = 0.6)
    }
    p
  })

  # Hover tooltip — minimal: identifier + the two plotted values + colour group.
  output$hover_tooltip <- renderUI({
    df <- scatter_base()
    hv <- input$plot_hover
    if (is.null(hv)) return(NULL)
    pt <- nearPoints(df, hv, xvar = input$x, yvar = input$y,
                     threshold = 8, maxpoints = 1)
    if (nrow(pt) == 0) return(NULL)

    # Convert data coords -> pixel position inside the plotting panel.
    left_pct <- (hv$x - hv$domain$left) / (hv$domain$right - hv$domain$left)
    top_pct  <- (hv$domain$top - hv$y)  / (hv$domain$top - hv$domain$bottom)
    left_px  <- hv$range$left + left_pct * (hv$range$right - hv$range$left)
    top_px   <- hv$range$top  + top_pct  * (hv$range$bottom - hv$range$top)

    xlab <- names(CONT_CHOICES)[CONT_CHOICES == input$x]
    ylab <- names(CONT_CHOICES)[CONT_CHOICES == input$y]
    zlab <- names(CAT_CHOICES)[CAT_CHOICES == input$z]
    nick <- if ("nickname" %in% names(pt)) as.character(pt$nickname[1]) else "—"

    div(class = "tooltip-box",
        style = paste0("left:", round(left_px) + 8, "px; top:",
                       round(top_px) + 8, "px;"),
        HTML(paste0(
          "<b>", nick, "</b><br>",
          xlab, ": ", pt[[input$x]][1], "<br>",
          ylab, ": ", pt[[input$y]][1], "<br>",
          zlab, ": ", as.character(pt[[input$z]][1])
        ))
    )
  })

  # Brushed selection -> identifiable table.
  selected_rows <- reactive({
    df <- scatter_base()
    brushedPoints(df, input$plot_brush, xvar = input$x, yvar = input$y)
  })

  output$sel_table <- DT::renderDataTable({
    sel <- selected_rows()
    validate(need(nrow(sel) > 0, "No points selected — drag a box on the plot."))
    cols <- intersect(unique(c(REP_FIELDS, input$x, input$y)), names(sel))
    DT::datatable(sel[, cols, drop = FALSE],
                  rownames = FALSE, options = list(pageLength = 5, dom = "tip"))
  })

  # Descriptive statistics of the selected X and Y.
  output$sel_stats <- renderTable({
    sel <- selected_rows()
    validate(need(nrow(sel) > 0, ""))
    rbind(
      describe_num(sel[[input$x]], names(CONT_CHOICES)[CONT_CHOICES == input$x]),
      describe_num(sel[[input$y]], names(CONT_CHOICES)[CONT_CHOICES == input$y])
    )
  }, striped = TRUE, spacing = "xs")

  # Bivariate correlation of the selection (Pearson + Spearman).
  output$sel_corr <- renderUI({
    sel <- selected_rows()
    if (nrow(sel) == 0) return(NULL)
    if (identical(input$x, input$y)) {
      return(helpText("Pick different X and Y for a correlation."))
    }
    xv <- sel[[input$x]]; yv <- sel[[input$y]]
    ok <- is.finite(xv) & is.finite(yv)
    if (sum(ok) < 3) return(helpText("Select ≥ 3 valid points for a correlation."))
    pear <- suppressWarnings(cor.test(xv[ok], yv[ok], method = "pearson"))
    spear <- suppressWarnings(cor.test(xv[ok], yv[ok], method = "spearman"))
    HTML(paste0(
      "<b>Selected n = ", sum(ok), "</b><br>",
      "Pearson r = ", round(unname(pear$estimate), 3),
      " (p = ", signif(pear$p.value, 3), ")<br>",
      "Spearman &rho; = ", round(unname(spear$estimate), 3),
      " (p = ", signif(spear$p.value, 3), ")"
    ))
  })

  # ---- Tab 2: Distributions -------------------------------------------------

  output$distplot <- renderPlot({
    df <- cognitive_data()
    validate(need(nrow(df) > 0, "Waiting for data…"))
    v <- input$dist_var
    lab <- names(CONT_CHOICES)[CONT_CHOICES == v]
    p <- ggplot(df, aes(x = .data[[v]]))
    if (input$dist_fill != "none") {
      p <- ggplot(df, aes(x = .data[[v]], fill = .data[[input$dist_fill]]))
    }
    p <- p +
      geom_histogram(bins = input$dist_bins, colour = "white",
                     alpha = 0.85, na.rm = TRUE, position = "identity") +
      labs(x = lab, y = "Count",
           title = paste("Distribution of", lab)) +
      theme_minimal(base_size = 13)
    if (isTRUE(input$dist_norm) && input$dist_fill == "none") {
      x <- df[[v]]; x <- x[is.finite(x)]
      if (length(x) > 2) {
        bw <- (max(x) - min(x)) / input$dist_bins
        p <- p + stat_function(
          fun = function(z) dnorm(z, mean(x), sd(x)) * length(x) * bw,
          colour = "firebrick", linewidth = 0.8, na.rm = TRUE)
      }
    }
    p
  })

  dist_selected <- reactive({
    df <- cognitive_data()
    br <- input$dist_brush
    if (is.null(br) || nrow(df) == 0) return(df[0, , drop = FALSE])
    v <- input$dist_var
    df[!is.na(df[[v]]) & df[[v]] >= br$xmin & df[[v]] <= br$xmax, , drop = FALSE]
  })

  output$dist_stats <- renderTable({
    sel <- dist_selected()
    validate(need(nrow(sel) > 0, "Drag across the histogram to isolate a range."))
    describe_num(sel[[input$dist_var]], names(CONT_CHOICES)[CONT_CHOICES == input$dist_var])
  }, striped = TRUE, spacing = "xs")

  output$dist_table <- DT::renderDataTable({
    sel <- dist_selected()
    validate(need(nrow(sel) > 0, ""))
    cols <- intersect(unique(c(REP_FIELDS, input$dist_var)), names(sel))
    DT::datatable(sel[, cols, drop = FALSE], rownames = FALSE,
                  options = list(pageLength = 5, dom = "tip"))
  })

  # ---- Tab 3: Group comparison ----------------------------------------------

  output$boxplot <- renderPlot({
    df <- cognitive_data()
    validate(need(nrow(df) > 0, "Waiting for data…"))
    g <- input$grp_cat; y <- input$grp_y
    d <- df[!is.na(df[[g]]) & !is.na(df[[y]]), , drop = FALSE]
    validate(need(nrow(d) > 0, "No complete cases for this pair."))
    p <- ggplot(d, aes(x = .data[[g]], y = .data[[y]], fill = .data[[g]])) +
      geom_boxplot(outlier.shape = NA, alpha = 0.65, na.rm = TRUE) +
      labs(x = names(CAT_CHOICES)[CAT_CHOICES == g],
           y = names(CONT_CHOICES)[CONT_CHOICES == y],
           title = paste(names(CONT_CHOICES)[CONT_CHOICES == y], "by",
                         names(CAT_CHOICES)[CAT_CHOICES == g])) +
      theme_minimal(base_size = 13) +
      theme(legend.position = "none")
    if (isTRUE(input$grp_points)) {
      p <- p + geom_jitter(width = 0.15, alpha = 0.5, size = 1.8, na.rm = TRUE)
    }
    p
  })

  output$grp_stats <- renderTable({
    df <- cognitive_data()
    validate(need(nrow(df) > 0, ""))
    g <- input$grp_cat; y <- input$grp_y
    d <- df[!is.na(df[[g]]) & !is.na(df[[y]]), , drop = FALSE]
    validate(need(nrow(d) > 0, "No complete cases."))
    d %>%
      group_by(.data[[g]]) %>%
      summarise(
        n      = dplyr::n(),
        Mean   = round(mean(.data[[y]]), 2),
        SD     = round(sd(.data[[y]]), 2),
        Median = round(median(.data[[y]]), 2),
        IQR    = round(IQR(.data[[y]]), 2),
        Min    = round(min(.data[[y]]), 2),
        Max    = round(max(.data[[y]]), 2),
        .groups = "drop"
      ) %>%
      rename(Group = 1) %>%
      as.data.frame()
  }, striped = TRUE, spacing = "xs")

  output$grp_testout <- renderPrint({
    df <- cognitive_data()
    if (nrow(df) == 0) { cat("Waiting for data…"); return(invisible()) }
    g <- input$grp_cat; y <- input$grp_y
    d <- df[!is.na(df[[g]]) & !is.na(df[[y]]), , drop = FALSE]
    d[[g]] <- droplevels(as.factor(d[[g]]))
    if (nlevels(d[[g]]) < 2) { cat("Need ≥ 2 groups with data."); return(invisible()) }
    fml <- reformulate(g, response = y)
    if (input$grp_test == "kw") {
      print(kruskal.test(fml, data = d))
    } else {
      print(summary(aov(fml, data = d)))
    }
  })

  # ---- Tab 4: Correlations --------------------------------------------------

  corr_matrix <- reactive({
    df <- cognitive_data()
    validate(need(nrow(df) > 1, "Waiting for data…"))
    vars <- intersect(input$corr_vars, names(df))
    validate(need(length(vars) >= 2, "Select at least two numeric fields."))
    m <- suppressWarnings(cor(df[, vars, drop = FALSE],
                              use = "pairwise.complete.obs",
                              method = input$corr_method))
    m
  })

  output$corrplot <- renderPlot({
    m <- corr_matrix()
    long <- as.data.frame(as.table(m))
    names(long) <- c("Var1", "Var2", "r")
    # Pretty labels
    relabel <- function(v) names(CONT_CHOICES)[match(v, CONT_CHOICES)]
    long$Var1 <- factor(long$Var1, levels = colnames(m), labels = relabel(colnames(m)))
    long$Var2 <- factor(long$Var2, levels = colnames(m), labels = relabel(colnames(m)))
    ggplot(long, aes(Var1, Var2, fill = r)) +
      geom_tile(colour = "white") +
      geom_text(aes(label = ifelse(is.na(r), "", sprintf("%.2f", r))), size = 3) +
      scale_fill_gradient2(low = "#2166ac", mid = "white", high = "#b2182b",
                           midpoint = 0, limits = c(-1, 1), na.value = "grey90") +
      labs(x = NULL, y = NULL,
           title = paste0(tools::toTitleCase(input$corr_method), " correlations"),
           fill = "r") +
      theme_minimal(base_size = 12) +
      theme(axis.text.x = element_text(angle = 45, hjust = 1))
  })

  output$corr_table <- DT::renderDataTable({
    m <- corr_matrix()
    out <- round(as.data.frame(m), 3)
    DT::datatable(out, options = list(pageLength = 15, dom = "tip", scrollX = TRUE))
  })

  # ---- Tab 5: Data explorer -------------------------------------------------

  output$explorer <- DT::renderDataTable({
    df <- cognitive_data()
    validate(need(nrow(df) > 0, "Waiting for data from the live sheet…"))
    show <- df[, setdiff(names(df), "timestamp_parsed"), drop = FALSE]
    DT::datatable(show, filter = "top", rownames = FALSE,
                  options = list(pageLength = 15, scrollX = TRUE))
  })

  output$dl_csv <- downloadHandler(
    filename = function() paste0("cognitive_data_", Sys.Date(), ".csv"),
    content  = function(file) {
      df <- cognitive_data()
      write.csv(df[, setdiff(names(df), "timestamp_parsed"), drop = FALSE],
                file, row.names = FALSE)
    }
  )
}


# ---- Run ---------------------------------------------------------------------
shinyApp(ui = ui, server = server)
