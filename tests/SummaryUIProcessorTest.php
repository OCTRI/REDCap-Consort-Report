<?php
use Octri\ConsortReport\SummaryUIProcessor,
    Octri\ConsortReport\DataDictionary,
    PHPUnit\Framework\TestCase;

/**
 * @covers SummaryUIProcessor
 */
final class SummaryUIProcessorTest extends TestCase {

    /**
     * Report as returned by REDCap.
     */
    private $mockReport = array(
        array('screen_id' => 1, 'dsp_stop_reason' => 'Patient follow-up'),
        array('screen_id' => 2, 'dsp_stop_reason' => 'Patient withdrew consent'),
        array('screen_id' => 3, 'dsp_stop_reason' => 'Patient follow-up'),
        array('screen_id' => 4, 'dsp_stop_reason' => 'Patient follow-up'),
        array('screen_id' => 5, 'dsp_stop_reason' => 'Patient withdrew consent'),
        array('screen_id' => 6, 'dsp_stop_reason' => 'Perceived drug side effects')
    );

    /**
     * An entry in the array found in `sample.report-config.json`. This summary
     * config is for an itemized report.
     */
    private $mockItemizedSummaryConfig = array(
        'reportId' => 42,
        'title' => 'Test Report Summary',
        'strategy' => 'itemized',
        'bucketBy' => 'dsp_stop_reason'
    );

    /**
     * An entry in the array found in `sample.report-config.json`. This summary
     * config is for a report that only includes the total number of records.
     */
    private $mockTotalSummaryConfig = array(
        'reportId' => 43,
        'title' => 'Test Report Summary with Total',
        'strategy' => 'total'
    );

    /**
     * Mock array data returned by `REDCap::getDataDictionary('array')`
     */
    private $mockDictionaryData = array(
      'screen_id' => array(
        'field_name' => 'screen_id',
        'form_name' => 'screening_id',
        'field_label' => 'Screening Id'
      ),
      'dsp_stop_reason' => array(
        'field_name' => 'dsp_stop_reason',
        'form_name' => 'subject_data',
        'field_label' => 'Stop Reason'
      ),
      'another_field' => array(
        'field_name' => 'another_field',
        'form_name' => 'another_form',
        'field_label' => 'Another Field'
      )
    );

    /**
     * Instance of lib/DataDictionary.php
     */
    private $mockDataDictionary;

    public function setUp() {
        $this->mockDataDictionary = new DataDictionary($this->mockDictionaryData);
    }

    public function testReportSummaryWithOnlyTotalCount() {
        $expectedSummaryConfig = array_merge($this->mockTotalSummaryConfig,
            array("totalRecords" => 6));

        $reportProcessor = new SummaryUIProcessor($this->mockTotalSummaryConfig, $this->mockReport, $this->mockDataDictionary);

        $processedSummaryConfig = $reportProcessor->summaryConfig();

        $this->assertEquals($expectedSummaryConfig, $processedSummaryConfig, "The processed summary config should contain total number of records.");
        $this->assertEquals(6, $processedSummaryConfig['totalRecords'], "Processed summary config should include the total number of records.");
    }

    public function testItemizedReportSummary() {
        $expectedBucketData = array(
            'Patient follow-up',
            'Patient withdrew consent',
            'Patient follow-up',
            'Patient follow-up',
            'Patient withdrew consent',
            'Perceived drug side effects'
        );

        $expectedSummaryConfig = array_merge($this->mockItemizedSummaryConfig, array(
            "totalRecords" => 6
        ));

        $reportProcessor = new SummaryUIProcessor($this->mockItemizedSummaryConfig, $this->mockReport, $this->mockDataDictionary);

        $processedSummaryConfig = $reportProcessor->summaryConfig();

        $this->assertEquals($expectedSummaryConfig, $processedSummaryConfig, "The processed summary config should contain bucket data and total number of records.");
        $this->assertEquals(6, $processedSummaryConfig['totalRecords'], "Processed summary config should include the total number of records.");
    }

}