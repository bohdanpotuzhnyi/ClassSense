---
title: "Taler SAP integration: Theoretical Framework and Practical Implementation"
author: [Bohdan Potuzhnyi, Vlada Svirsh]
date: "2024-2025"
subject: "Bachelor thesis"
keywords: [Taler, SAP, Dolibarr, API Integration, Middleware, Transaction Processing, ERP]
titlepage: true
titlepage-color: "FFFFFF"
titlepage-text-color: "697d91"
titlepage-rule-color: "697d91"
titlepage-rule-height: 2
titlepage-logo: "pictures/BFH_Logo_deutsch.png"
toc: true
toc-own-page: true
toc-depth: 3
lof: true
logo: "pictures/BFH_Logo_deutsch.png"
link-citations: true
numbersections: true
header-includes:
  - \usepackage{graphicx}  
  - \usepackage{svg}       
  - \usepackage{amsmath}   
  - \usepackage{hyperref}
  - \usepackage{float}
mainfont: SFProText
sansfont: SFPro
monofont: SFMono
abstract: |
  \newpage
  # Abstract {.unnumbered .unlisted}
  This thesis explores the theoretical integration of the GNU Taler Merchant Backend with different ERP systems such as SAP
  and Dolibarr, aiming to streamline transaction processing, financial management, resource planning, and customer relationship
  management. GNU Taler --- a digital payment system designed for secure and private transactions, is examined in the context
  of ERP systems like SAP and Dolibarr. The thesis provides a comprehensive theoretical framework for the integration,
  including an analysis of system architecture, methodology, and data flow. Emphasis is placed on real-time data synchronization,
  the automation of manual processes, and the security protocols necessary for ensuring data integrity. While the focus is
  primarily on the theoretical aspects of integration, this thesis also outlines potential practical implications for future
  implementations in various ERP environments, particularly SAP S/4HANA and Dolibarr. The thesis lays the groundwork for
  further development and testing by offering detailed insights into the technical requirements and challenges of such an
  integration. This thesis includes a section on the practical implementation of the integration in the SAP S/4HANA 
  system, debating the correctness of the proposed solution and describing the challenges of such integration.
  \newpage
---

\newpage

# **Terminology** {- .unlisted}

1. **Taler** — A protocol for digital cash.

2. **GNU Taler** — Software supporting the Taler protocol.

3. **Consumer** — The person or company interacting with a business. This includes individual customers and corporate 
clients buying goods or services. In the context of GNU Taler integration, consumers represent the end users of the payment system.

4. **Merchant** — The business entity that uses the GNU Taler Merchant Backend for processing transactions, selling 
goods, and issuing refunds.

5. **Goods** — A general term describing the items in inventory, including both physical and digital products, 
used in sales or refund processes.

6. **ERP** — Enterprise resource planning software system that helps organizations(merchants) streamline their core business 
processes.

7. **SPAA (Single-Page Administration Application)** — The web-based administration tool for using the GNU Taler 
Merchant Backend.

8. **CRM** --- Customer Relationship Management. 

9. **SMEs (Small and Medium-sized Enterprises)** — Businesses with limited resources compared to larger corporations. 

10. **SAP R/3** — An older version of SAP ERP software, which has been succeeded by SAP S/4HANA.

11. **SAP S/4HANA** — The latest version of SAP ERP software, designed for real-time data processing and analytics.

12. **Order document** — A standard name in the SAP system for documents that record information about one specific order
in SAP systems.

13. **Billing document** — A standard name in the SAP system for documents that record information about one 
specific billing document, treat as request to be paid.

14. **SAP SuccessFactors** — A cloud-based solution for human capital management (HCM) that integrates with 
the SAP ecosystem.

15. **T-code** — Short for "Transaction Code," a unique identifier in SAP systems that allows users to 
access specific functions or screens.

\newpage

[//]: # (# **Project 2 Planning** {-})

[//]: # ()
[//]: # ()
[//]: # ()
[//]: # ()
[//]: # (!include chapters/planning.md)

[//]: # ()
[//]: # ()
[//]: # ()
[//]: # ()
[//]: # (\newpage)

[//]: # ()
[//]: # ()
[//]: # ()
[//]: # ()
[//]: # (# **Bachelor Thesis Planning** {-})

[//]: # ()
[//]: # ()
[//]: # ()
[//]: # ()
[//]: # (!include chapters/bt_planning.md)

[//]: # ()
[//]: # ()
[//]: # ()
[//]: # (\newpage)

\newpage

# **Introduction**

!include chapters/1_introduction.md

\newpage

# **Technology Overview of Existing Components**

!include chapters/2_literaturereview.md

\newpage

# **Technical Design of Integration Solution**

!include chapters/3_methodology_new.md

\newpage

# **Practical Implementation in the SAP S4/HANA Environment**

!include chapters/4_practical_implementation.md

\newpage

# **Discussion**

!include chapters/5_discussion.md

\newpage

# **Conclusion**

!include chapters/6_conclusion.md

\newpage

# **References** {-}

::: {#refs}
:::

\newpage

# **Appendices** {-}

## Appendix A: Webhook documentation for Taler {- #taler_webhook}

!include appendices/a2_merchant-api-webhooks.md

\newpage

## Appendix B: UI Samples {- #appendix_ui_samples}

!include appendices/b1_ui_samples.md

