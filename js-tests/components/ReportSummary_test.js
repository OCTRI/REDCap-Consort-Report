import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';

import ReportSummary from '@/components/ReportSummary';
import ReportSummaryForm from '@/components/ReportSummaryForm';
import ReportSummaryModel from '@/report-summary-model';
import { STRATEGY } from '@/report-strategy';
import { MISSING } from '@/constants';
import shuffle from 'lodash/shuffle';
import { messages } from '@/components/ReportSummary';

import { createProvideObject, mockSecurityConfig } from '../test-utils';

const selectors = {
  metadata: '.summary-metadata li',
  counts: '[data-description="itemized-counts"] li'
};

describe('ReportSummary.vue', () => {
  const securityConfig = mockSecurityConfig(true);

  describe('For total strategy', () => {
    let wrapper;

    beforeEach(() => {
      const model = ReportSummaryModel.fromObject({
        id: 'a51361a1-8d64-4348-a28a-fc6b5dcca663',
        title: 'Sample Report Name',
        reportTitle: 'Report Title',
        totalRecords: 101,
        strategy: STRATEGY.TOTAL,
        reportExists: true
      });

      wrapper = shallowMount(ReportSummary, {
        propsData: {
          model,
          securityConfig
        }
      });
    });

    it('renders report summary', () => {
      const reportName = wrapper.find('h3');
      expect(reportName.text()).toEqual('Sample Report Name');
      const metadata = wrapper.findAll(selectors.metadata);
      expect(metadata.length).toEqual(2);
      expect(metadata.at(0).text()).toEqual('Total Count: 101');
      expect(metadata.at(1).text()).toEqual('Report Name: Report Title');
    });
  });

  describe('For itemized strategy', () => {
    let wrapper;

    beforeEach(() => {
      const model = ReportSummaryModel.fromObject({
        id: 'a48bc291-951f-4ef6-9ec3-fff6291d7cd1',
        title: 'Sample Itemized Report Name',
        reportTitle: 'Sample Report Title',
        totalRecords: 6,
        strategy: STRATEGY.ITEMIZED,
        bucketByLabel: 'Field Label',
        bucketByFieldExists: true,
        bucketByExistsOnReport: true,
        reportExists: true,
        data: [
          'Patient follow-up',
          'Patient withdrew consent',
          'Patient follow-up',
          'Patient follow-up',
          'Patient withdrew consent',
          'Perceived drug side effects'
        ]
      });

      wrapper = shallowMount(ReportSummary, {
        propsData: {
          model,
          securityConfig
        }
      });
    });

    it('renders report summary with itemized counts', () => {
      const reportName = wrapper.find('h3');
      expect(reportName.text()).toEqual('Sample Itemized Report Name');

      const li = wrapper.findAll(selectors.counts);
      expect(li.length).toEqual(3);
      expect(li.at(0).text()).toEqual('3 - Patient follow-up');
      expect(li.at(1).text()).toEqual('2 - Patient withdrew consent');
      expect(li.at(2).text()).toEqual('1 - Perceived drug side effects');
    });

    it('renders a metadata section', () => {
      const metadata = wrapper.findAll(selectors.metadata);
      expect(metadata.length).toEqual(3);
      expect(metadata.at(0).text()).toEqual('Total Count: 6');
      expect(metadata.at(1).text()).toEqual('Report Name: Sample Report Title');
      expect(metadata.at(2).text()).toEqual('Grouped By: Field Label');
    });

    it('emits deleteSummary event', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      wrapper.find('.delete').trigger('click');
      expect(wrapper.emitted('summaryDeleted')).toBeTruthy();
      expect(wrapper.emitted('summaryDeleted')[0]).toBeTruthy();
    });

    it('does not emit deleteSummary event if canceled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      wrapper.find('.delete').trigger('click');
      expect(wrapper.emitted('summaryDeleted')).toBeFalsy();
    });
  });

  describe('Report Summary ordering', () => {
    const model = ReportSummaryModel.fromObject({
      id: '7e09f84b-76d8-48bb-9eca-e1e4fe33f844',
      title: 'Test Report Summary',
      totalRecords: 8,
      strategy: STRATEGY.ITEMIZED,
      bucketByFieldExists: true,
      bucketByExistsOnReport: true,
      reportExists: true,
      data: []
    });

    it('handles missing values', () => {
      model.data = [
        'Patient follow-up',
        '42',
        'Patient withdrew consent',
        '',
        'Patient follow-up',
        '42',
        'Patient follow-up',
        null,
        'Patient withdrew consent',
        '42',
        '42',
        'Perceived drug side effects',
        '       '
      ];

      const wrapper = shallowMount(ReportSummary, {
        propsData: {
          model,
          securityConfig
        }
      });
      expect(wrapper.vm.hasMissingValue).toEqual(true);

      const li = wrapper.findAll(selectors.counts);
      expect(li.length).toEqual(5);
      expect(li.at(4).text()).toEqual(`3 - ${MISSING}`);
    });

    it('orders counts', () => {
      model.data = shuffle([
        ...new Array(3).fill('January'),
        ...new Array(2).fill('Afakemonth'),
        ...new Array(10).fill('February'),
        ...new Array(2).fill('August'),
        ...new Array(40).fill(''),
        ...new Array(2).fill(null),
        ...new Array(7).fill('March'),
        ...new Array(2).fill('April'),
        ...new Array(15).fill('May')
      ]);

      const wrapper = shallowMount(ReportSummary, {
        propsData: {
          model,
          securityConfig
        }
      });

      const li = wrapper.findAll(selectors.counts);
      expect(li.length).toEqual(8);

      // Count in descending order
      expect(li.at(0).text()).toEqual('15 - May');
      expect(li.at(1).text()).toEqual('10 - February');
      expect(li.at(2).text()).toEqual('7 - March');
      expect(li.at(3).text()).toEqual('3 - January');

      // Label is ascending when the count is the same
      expect(li.at(4).text()).toEqual('2 - Afakemonth');
      expect(li.at(5).text()).toEqual('2 - April');
      expect(li.at(6).text()).toEqual('2 - August');

      // Missing is always the last count
      expect(li.at(7).text()).toEqual(`42 - ${MISSING}`);
    });
  });

  describe('editing', () => {
    let wrapper, model;

    beforeEach(() => {
      model = ReportSummaryModel.fromObject({
        id: '68d41098-f49a-4241-8014-ab519224fda7',
        title: 'Original Title',
        reportId: 3,
        strategy: STRATEGY.TOTAL,
        totalRecords: 99,
        reportExists: true
      });

      wrapper = mount(ReportSummary, {
        provide: createProvideObject(),
        propsData: {
          model,
          securityConfig
        }
      });
    });

    it('reveals the form when the edit link is clicked', async () => {
      expect(wrapper.findComponent(ReportSummaryForm).exists()).toBe(false);
      wrapper.find('.edit').trigger('click');
      await Vue.nextTick();
      expect(wrapper.findComponent(ReportSummaryForm).exists()).toBe(true);
    });

    it('closes the form on cancel', async () => {
      wrapper.find('.edit').trigger('click');
      await Vue.nextTick();
      expect(wrapper.findComponent(ReportSummaryForm).exists()).toBe(true);

      wrapper.find('button[type="cancel"]').trigger('click');
      await Vue.nextTick();
      expect(wrapper.findComponent(ReportSummaryForm).exists()).toBe(false);
    });

    it('emits an event when updated config is saved', async () => {
      wrapper.find('.edit').trigger('click');
      await Vue.nextTick();
      wrapper.find('input[name="title"]').setValue('New Title');
      await Vue.nextTick();
      wrapper.find('button[type="submit"]').trigger('click');
      await Vue.nextTick();

      // allow time for the form's save promise to resolve
      await Promise.resolve();

      expect(wrapper.emitted('reportSummaryUpdated')).toBeTruthy();

      const updatedModel = wrapper.emitted('reportSummaryUpdated')[0][0];
      expect(updatedModel).not.toEqual(model);
      expect(updatedModel.title).toEqual('New Title');
    });

    it('closes the form after saving', async () => {
      wrapper.find('.edit').trigger('click');
      await Vue.nextTick();
      wrapper.find('input[name="title"]').setValue('New Title');
      await Vue.nextTick();
      wrapper.find('button[type="submit"]').trigger('click');
      await Vue.nextTick();

      // allow time for the form's save promise to resolve
      await Promise.resolve();

      expect(wrapper.findComponent(ReportSummaryForm).exists()).toBe(false);
    });
  });

  describe('drag and drop', () => {
    let wrapper;

    beforeEach(() => {
      const model = ReportSummaryModel.fromObject({
        id: 'a51361a1-8d64-4348-a28a-fc6b5dcca663',
        title: 'Some Name',
        totalRecords: 10,
        strategy: STRATEGY.TOTAL,
        reportExists: true
      });

      wrapper = shallowMount(ReportSummary, {
        propsData: {
          model,
          securityConfig
        }
      });
    });

    it('is disabled by default to allow text selection', () => {
      expect(wrapper.attributes('draggable')).toEqual('false');
    });

    it('is enabled when the drag handle is grabbed', async () => {
      expect(wrapper.attributes('draggable')).toEqual('false');
      wrapper.find('.drag-handle').trigger('mousedown');
      await Vue.nextTick();
      expect(wrapper.attributes('draggable')).toEqual('true');
    });

    it('is disabled when the drag handle is released', () => {
      wrapper.setData({ draggable: true });
      wrapper.find('.drag-handle').trigger('mouseup');
      expect(wrapper.attributes('draggable')).toEqual('false');
    });

    it('emits an event with the id when the user starts to drag it', () => {
      wrapper.trigger('dragstart');
      expect(wrapper.emitted('reorder-start')[0][0]).toEqual(wrapper.vm.model.id);
    });

    it('emits an event when an item is dropped on it', () => {
      wrapper.trigger('drop');
      expect(wrapper.emitted('reorder-end')).toBeTruthy();
    });

    it('disables dragging when the drag ends', () => {
      const dataTransfer = new DataTransfer();
      dataTransfer.dropEffect = 'move';

      wrapper.setData({ draggable: true });
      wrapper.trigger('dragend', {
        dataTransfer
      });

      expect(wrapper.attributes('draggable')).toEqual('false');
    });

    it('emits an event if the drag is canceled', () => {
      const dataTransfer = new DataTransfer();
      dataTransfer.dropEffect = 'none';

      wrapper.trigger('dragend', {
        dataTransfer
      });

      expect(wrapper.emitted('reorder-cancel')).toBeTruthy();
    });
  });

  describe('report does not exist', () => {
    let wrapper, model;

    beforeEach(() => {
      model = ReportSummaryModel.fromObject({
        id: '68d41098-f49a-4241-8014-ab519224fda7',
        title: 'Original Title',
        reportId: 3,
        reportExists: false
      });

      wrapper = mount(ReportSummary, {
        provide: createProvideObject(),
        propsData: {
          model,
          securityConfig
        }
      });
    });

    it('displays inline error message when report does not exist', () => {
      expect(wrapper.findAll('[data-description="report-alert"]').length).toEqual(1);
      expect(wrapper.find('[data-description="report-alert"]').text()).toEqual(messages.missingReport);
    });

    it('displays title and summary controls when the report does not exist', () => {
      expect(wrapper.findAll('.summary-controls').length).toEqual(1);
      expect(wrapper.findAll('.card-title').length).toEqual(1);
      expect(wrapper.find('.card-title').text()).toEqual('Original Title');
    });
  });

  describe('bucketBy field error handling', () => {
    let wrapper, model;

    beforeEach(() => {
      model = ReportSummaryModel.fromObject({
        id: '68d41098-f49a-4241-8014-ab519224fda7',
        title: 'Original Title',
        reportId: 3,
        reportTitle: 'Title of Report',
        totalRecords: 8,
        strategy: STRATEGY.ITEMIZED,
        reportExists: true,
        data: []
      });
    });

    describe('error helper', () => {
      beforeEach(() => {
        wrapper = mount(ReportSummary, {
          provide: createProvideObject(),
          propsData: {
            model,
            securityConfig
          }
        });
      });

      it('builds the correct error message', () => {
        const expectedMessage = `${messages.missingBucketByField} "Foo".`;
        expect(wrapper.vm.missingBucketByFieldError('Foo')).toEqual(expectedMessage);
      });
    });

    describe('bucketBy field does not exist', () => {
      beforeEach(() => {
        model.bucketByFieldExists = false;
        model.bucketByExistsOnReport = false;
        wrapper = mount(ReportSummary, {
          provide: createProvideObject(),
          propsData: {
            model,
            securityConfig
          }
        });
      });

      it('displays inline error message', () => {
        expect(wrapper.findAll('[data-description="report-alert"]').length).toEqual(1);
        expect(wrapper.find('[data-description="report-alert"]').text()).toEqual(wrapper.vm.missingBucketByFieldError('Title of Report'));
      });

      it('displays title and summary controls', () => {
        expect(wrapper.findAll('.summary-controls').length).toEqual(1);
        expect(wrapper.findAll('.card-title').length).toEqual(1);
        expect(wrapper.find('.card-title').text()).toEqual('Original Title');
      });
    });

    describe('bucketBy field missing from report', () => {
      beforeEach(() => {
        model.bucketByFieldExists = true;
        model.bucketByExistsOnReport = false;
        wrapper = mount(ReportSummary, {
          provide: createProvideObject(),
          propsData: {
            model,
            securityConfig
          }
        });
      });

      it('displays inline error message', () => {
        expect(wrapper.findAll('[data-description="report-alert"]').length).toEqual(1);
        expect(wrapper.find('[data-description="report-alert"]').text()).toEqual(wrapper.vm.missingBucketByFieldError('Title of Report'));
      });

      it('displays title and summary controls', () => {
        expect(wrapper.findAll('.summary-controls').length).toEqual(1);
        expect(wrapper.findAll('.card-title').length).toEqual(1);
        expect(wrapper.find('.card-title').text()).toEqual('Original Title');
      });
    });
  });

  describe('security configuration', () => {
    let wrapper, model;

    beforeEach(() => {
      model = ReportSummaryModel.fromObject({
        id: '68d41098-f49a-4241-8014-ab519224fda7',
        title: 'Original Title',
        reportId: 3,
        totalRecords: 8,
        strategy: STRATEGY.TOTAL,
        bucketByFieldExists: false,
        reportExists: true
      });
    });

    describe('basic user - does not have access to modify counts', () => {
      beforeEach(() => {
        wrapper = mount(ReportSummary, {
          provide: createProvideObject(),
          propsData: {
            model,
            securityConfig: mockSecurityConfig(false)
          }
        });
      });

      it('hides summary controls and drag handle', () => {
        expect(wrapper.findAll('.summary-controls').length).toEqual(0);
        expect(wrapper.findAll('.drag-handle').length).toEqual(0);
      });
    });

    describe('admin user - has access to modify counts', () => {
      beforeEach(() => {
        wrapper = mount(ReportSummary, {
          provide: createProvideObject(),
          propsData: {
            model,
            securityConfig: mockSecurityConfig(true)
          }
        });
      });

      it('shows summary controls and drag handle', () => {
        expect(wrapper.findAll('.summary-controls').length).toEqual(1);
        expect(wrapper.findAll('.drag-handle').length).toEqual(1);
      });
    });
  });
});